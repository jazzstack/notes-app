use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::Manager;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub path: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    pub tags: Vec<String>,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vault {
    pub path: String,
    pub name: String,
    pub last_opened: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultConfig {
    pub vaults: Vec<Vault>,
    pub current_vault_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_note: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultState {
    pub path: String,
    pub initialized: bool,
}

fn get_vault_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(app_dir.join("vault_config.json"))
}

fn ensure_vault_config(app_handle: &tauri::AppHandle) -> Result<VaultConfig, String> {
    let config_path = get_vault_config_path(app_handle)?;

    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read vault config: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse vault config: {}", e))
    } else {
        Ok(VaultConfig {
            vaults: Vec::new(),
            current_vault_path: None,
        })
    }
}

fn save_vault_config(app_handle: &tauri::AppHandle, config: &VaultConfig) -> Result<(), String> {
    let config_path = get_vault_config_path(app_handle)?;
    let app_dir = config_path.parent().ok_or("Invalid config path")?;

    if !app_dir.exists() {
        fs::create_dir_all(app_dir).map_err(|e| format!("Failed to create app dir: {}", e))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize vault config: {}", e))?;

    fs::write(&config_path, content).map_err(|e| format!("Failed to write vault config: {}", e))
}

fn slugify(title: &str) -> String {
    title
        .to_lowercase()
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("-")
}

fn get_vault_name_from_path(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Vault")
        .to_string()
}

fn extract_frontmatter(content: &str) -> (Option<String>, String, serde_json::Value) {
    let mut metadata = serde_json::json!({});
    let mut title: Option<String> = None;
    let mut body = content.to_string();

    if content.starts_with("---") {
        if let Some(end_idx) = content[3..].find("---") {
            let frontmatter = &content[3..end_idx + 3];
            body = content[end_idx + 6..].trim_start().to_string();

            for line in frontmatter.lines().skip(1) {
                if let Some(colon_idx) = line.find(':') {
                    let key = line[..colon_idx].trim().to_string();
                    let value = line[colon_idx + 1..].trim();

                    if key == "title" {
                        title = Some(value.trim_matches('"').trim_matches('\'').to_string());
                    } else {
                        metadata[key] = serde_json::Value::String(value.to_string());
                    }
                }
            }
        }
    }

    (title, body, metadata)
}

fn read_note_from_file(path: &Path) -> Result<Note, String> {
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    let (title, body, metadata) = extract_frontmatter(&content);

    let file_stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("untitled");

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled.md");

    let created_at = fs::metadata(path)
        .and_then(|m| m.created())
        .ok()
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Utc> = t.into();
            datetime.to_rfc3339()
        })
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    let modified_at = fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Utc> = t.into();
            datetime.to_rfc3339()
        })
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    let title = title.unwrap_or_else(|| file_stem.replace('-', " ").replace('_', " "));

    let relative_path = path.to_string_lossy().to_string();

    Ok(Note {
        id: slugify(&title) + "-" + &chrono::Utc::now().timestamp_millis().to_string(),
        title,
        content: body,
        path: relative_path,
        created_at,
        updated_at: modified_at,
        tags: vec![],
        metadata,
    })
}

fn is_note_file(path: &Path) -> bool {
    path.is_file()
        && path
            .extension()
            .map(|e| e == "md" || e == "markdown")
            .unwrap_or(false)
        && !path
            .file_name()
            .map(|n| n.to_string_lossy().starts_with('.'))
            .unwrap_or(false)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_vault_state(app_handle: tauri::AppHandle) -> Result<VaultState, String> {
    let config = ensure_vault_config(&app_handle)?;
    let is_initialized = config.current_vault_path.is_some();
    Ok(VaultState {
        path: config.current_vault_path.unwrap_or_default(),
        initialized: is_initialized,
    })
}

#[tauri::command]
fn set_vault_path(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let vault_path = Path::new(&path);

    if !vault_path.exists() {
        fs::create_dir_all(vault_path)
            .map_err(|e| format!("Failed to create vault directory: {}", e))?;
    }

    if !vault_path.is_dir() {
        return Err("Selected path is not a directory".to_string());
    }

    let mut config = ensure_vault_config(&app_handle)?;

    let vault_name = get_vault_name_from_path(&path);
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(existing_vault) = config.vaults.iter_mut().find(|v| v.path == path) {
        existing_vault.last_opened = Some(now);
    } else {
        config.vaults.push(Vault {
            path: path.clone(),
            name: vault_name,
            last_opened: Some(now),
        });
    }

    config.current_vault_path = Some(path.clone());

    save_vault_config(&app_handle, &config)?;

    log::info!("Vault path set to: {}", path);
    Ok(())
}

#[tauri::command]
fn get_vault_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let config = ensure_vault_config(&app_handle)?;
    Ok(config.current_vault_path.unwrap_or_default())
}

#[tauri::command]
fn list_vaults(app_handle: tauri::AppHandle) -> Result<Vec<Vault>, String> {
    let config = ensure_vault_config(&app_handle)?;
    Ok(config.vaults)
}

#[tauri::command]
fn create_vault(app_handle: tauri::AppHandle, name: String) -> Result<Vault, String> {
    let vaults_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("vaults");

    if !vaults_dir.exists() {
        fs::create_dir_all(&vaults_dir)
            .map_err(|e| format!("Failed to create vaults directory: {}", e))?;
    }

    let vault_path = vaults_dir.join(&name);

    if vault_path.exists() {
        return Err("Vault with this name already exists".to_string());
    }

    fs::create_dir_all(&vault_path).map_err(|e| format!("Failed to create vault: {}", e))?;

    let now = chrono::Utc::now().to_rfc3339();
    let vault = Vault {
        path: vault_path.to_string_lossy().to_string(),
        name: name.clone(),
        last_opened: Some(now.clone()),
    };

    let mut config = ensure_vault_config(&app_handle)?;
    config.vaults.push(vault.clone());
    config.current_vault_path = Some(vault.path.clone());
    save_vault_config(&app_handle, &config)?;

    log::info!("Created vault: {}", name);
    Ok(vault)
}

#[tauri::command]
fn delete_vault(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let vault_path = Path::new(&path);

    if !vault_path.exists() {
        return Err("Vault does not exist".to_string());
    }

    if !vault_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    fs::remove_dir_all(vault_path).map_err(|e| format!("Failed to delete vault: {}", e))?;

    let mut config = ensure_vault_config(&app_handle)?;
    config.vaults.retain(|v| v.path != path);

    if config.current_vault_path.as_ref() == Some(&path) {
        config.current_vault_path = config.vaults.first().map(|v| v.path.clone());
    }

    save_vault_config(&app_handle, &config)?;

    log::info!("Deleted vault: {}", path);
    Ok(())
}

#[tauri::command]
fn remove_vault(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let mut config = ensure_vault_config(&app_handle)?;
    config.vaults.retain(|v| v.path != path);

    if config.current_vault_path.as_ref() == Some(&path) {
        config.current_vault_path = config.vaults.first().map(|v| v.path.clone());
    }

    save_vault_config(&app_handle, &config)?;

    log::info!("Removed vault from list: {}", path);
    Ok(())
}

#[tauri::command]
fn set_current_vault(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let mut config = ensure_vault_config(&app_handle)?;

    if !config.vaults.iter().any(|v| v.path == path) {
        return Err("Vault not found in list".to_string());
    }

    if let Some(vault) = config.vaults.iter_mut().find(|v| v.path == path) {
        vault.last_opened = Some(chrono::Utc::now().to_rfc3339());
    }

    config.current_vault_path = Some(path.clone());
    save_vault_config(&app_handle, &config)?;

    log::info!("Set current vault to: {}", path);
    Ok(())
}

#[tauri::command]
fn list_directory(path: String, recursive: bool) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(&path);

    if !dir_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut entries = Vec::new();

    if recursive {
        for entry in WalkDir::new(dir_path)
            .max_depth(10)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let entry_path = entry.path();
            if entry_path == dir_path {
                continue;
            }

            let relative_path = entry_path
                .strip_prefix(dir_path)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if relative_path.starts_with('.') || relative_path.contains("/.") {
                continue;
            }

            entries.push(FileEntry {
                name: entry_path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                path: entry_path.to_string_lossy().to_string(),
                is_dir: entry_path.is_dir(),
                is_note: is_note_file(entry_path),
            });
        }
    } else {
        let read_dir =
            fs::read_dir(dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in read_dir.filter_map(|e| e.ok()) {
            let entry_path = entry.path();
            let name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            if name.starts_with('.') {
                continue;
            }

            entries.push(FileEntry {
                name,
                path: entry_path.to_string_lossy().to_string(),
                is_dir: entry_path.is_dir(),
                is_note: is_note_file(&entry_path),
            });
        }
    }

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

#[tauri::command]
fn create_note(vault_path: String, title: String) -> Result<Note, String> {
    let vault = Path::new(&vault_path);

    if !vault.exists() {
        return Err("Vault does not exist".to_string());
    }

    let slug = slugify(&title);
    let mut filename = format!("{}.md", slug);
    let mut file_path = vault.join(&filename);
    let mut counter = 1;

    while file_path.exists() {
        filename = format!("{}-{}.md", slug, counter);
        file_path = vault.join(&filename);
        counter += 1;
    }

    let now = chrono::Utc::now();
    let content = format!(
        "---\ntitle: \"{}\"\ncreated: {}\n---\n\n",
        title,
        now.to_rfc3339()
    );

    fs::write(&file_path, &content).map_err(|e| format!("Failed to create note: {}", e))?;

    log::info!("Created note: {:?}", file_path);

    Ok(Note {
        id: slug.clone() + "-" + &now.timestamp_millis().to_string(),
        title,
        content: String::new(),
        path: file_path.to_string_lossy().to_string(),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
        tags: vec![],
        metadata: serde_json::json!({}),
    })
}

#[tauri::command]
fn read_note(path: String) -> Result<Note, String> {
    let note_path = Path::new(&path);
    read_note_from_file(note_path)
}

#[tauri::command]
fn save_note(path: String, title: String, content: String) -> Result<Note, String> {
    let note_path = Path::new(&path);

    if !note_path.exists() {
        return Err("Note file does not exist".to_string());
    }

    let metadata =
        fs::metadata(note_path).map_err(|e| format!("Failed to get file metadata: {}", e))?;

    let created = metadata
        .created()
        .ok()
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Utc> = t.into();
            datetime.to_rfc3339()
        })
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    let now = chrono::Utc::now();
    let frontmatter = format!("---\ntitle: \"{}\"\ncreated: {}\n---\n\n", title, created);

    let file_content = format!("{}{}", frontmatter, content);

    fs::write(note_path, &file_content).map_err(|e| format!("Failed to save note: {}", e))?;

    log::info!("Saved note: {:?}", note_path);

    Ok(Note {
        id: slugify(&title) + "-" + &now.timestamp_millis().to_string(),
        title,
        content,
        path: path.clone(),
        created_at: created,
        updated_at: now.to_rfc3339(),
        tags: vec![],
        metadata: serde_json::json!({}),
    })
}

#[tauri::command]
fn delete_note(path: String) -> Result<(), String> {
    let note_path = Path::new(&path);

    if !note_path.exists() {
        return Err("Note file does not exist".to_string());
    }

    fs::remove_file(note_path).map_err(|e| format!("Failed to delete note: {}", e))?;

    log::info!("Deleted note: {:?}", note_path);
    Ok(())
}

#[tauri::command]
fn rename_note(old_path: String, new_title: String) -> Result<String, String> {
    let old_note_path = Path::new(&old_path);

    if !old_note_path.exists() {
        return Err("Note file does not exist".to_string());
    }

    let vault = old_note_path.parent().ok_or("Invalid path")?;
    let slug = slugify(&new_title);
    let new_filename = format!("{}.md", slug);
    let mut new_path = vault.join(&new_filename);

    let mut counter = 1;
    while new_path.exists() && new_path != old_note_path {
        new_path = vault.join(format!("{}-{}.md", slug, counter));
        counter += 1;
    }

    fs::rename(old_note_path, &new_path).map_err(|e| format!("Failed to rename note: {}", e))?;

    let content =
        fs::read_to_string(&new_path).map_err(|e| format!("Failed to read note: {}", e))?;

    let (old_title, body, metadata) = extract_frontmatter(&content);
    let created = old_title
        .as_ref()
        .map(|_| {
            content
                .lines()
                .find(|l| l.starts_with("created:"))
                .map(|l| l.replace("created:", "").trim().to_string())
                .unwrap_or_else(|| chrono::Utc::now().to_rfc3339())
        })
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    let new_content = format!(
        "---\ntitle: \"{}\"\ncreated: {}\n---\n\n{}",
        new_title, created, body
    );

    fs::write(&new_path, &new_content).map_err(|e| format!("Failed to update note: {}", e))?;

    log::info!("Renamed note from {:?} to {:?}", old_note_path, new_path);

    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn create_folder(vault_path: String, name: String) -> Result<String, String> {
    let vault = Path::new(&vault_path);
    let folder_path = vault.join(&name);

    if folder_path.exists() {
        return Err("Folder already exists".to_string());
    }

    fs::create_dir_all(&folder_path).map_err(|e| format!("Failed to create folder: {}", e))?;

    log::info!("Created folder: {:?}", folder_path);

    Ok(folder_path.to_string_lossy().to_string())
}

#[tauri::command]
fn delete_folder(path: String) -> Result<(), String> {
    let folder_path = Path::new(&path);

    if !folder_path.exists() {
        return Err("Folder does not exist".to_string());
    }

    if !folder_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    fs::remove_dir_all(folder_path).map_err(|e| format!("Failed to delete folder: {}", e))?;

    log::info!("Deleted folder: {:?}", folder_path);
    Ok(())
}

#[tauri::command]
fn rename_folder(old_path: String, new_name: String) -> Result<String, String> {
    let old_folder_path = Path::new(&old_path);

    if !old_folder_path.exists() {
        return Err("Folder does not exist".to_string());
    }

    let parent = old_folder_path.parent().ok_or("Invalid path")?;
    let new_path = parent.join(&new_name);

    fs::rename(old_folder_path, &new_path)
        .map_err(|e| format!("Failed to rename folder: {}", e))?;

    log::info!(
        "Renamed folder from {:?} to {:?}",
        old_folder_path,
        new_path
    );

    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn load_all_notes(vault_path: String) -> Result<Vec<Note>, String> {
    let vault = Path::new(&vault_path);

    if !vault.exists() {
        return Ok(vec![]);
    }

    let mut notes = Vec::new();

    for entry in WalkDir::new(vault)
        .max_depth(10)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if !is_note_file(path) {
            continue;
        }

        if let Ok(note) = read_note_from_file(path) {
            notes.push(note);
        }
    }

    notes.sort_by(|a, b| {
        let a_time = chrono::DateTime::parse_from_rfc3339(&a.updated_at)
            .map(|dt| dt.timestamp())
            .unwrap_or(0);
        let b_time = chrono::DateTime::parse_from_rfc3339(&b.updated_at)
            .map(|dt| dt.timestamp())
            .unwrap_or(0);
        b_time.cmp(&a_time)
    });

    log::info!("Loaded {} notes from vault", notes.len());
    Ok(notes)
}

#[tauri::command]
fn search_notes(vault_path: String, query: String) -> Result<Vec<Note>, String> {
    let vault = Path::new(&vault_path);

    if !vault.exists() || query.trim().is_empty() {
        return load_all_notes(vault_path);
    }

    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for entry in WalkDir::new(vault)
        .max_depth(10)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if !is_note_file(path) {
            continue;
        }

        if let Ok(note) = read_note_from_file(path) {
            if note.title.to_lowercase().contains(&query_lower)
                || note.content.to_lowercase().contains(&query_lower)
            {
                results.push(note);
            }
        }
    }

    results.sort_by(|a, b| {
        let a_time = chrono::DateTime::parse_from_rfc3339(&a.updated_at)
            .map(|dt| dt.timestamp())
            .unwrap_or(0);
        let b_time = chrono::DateTime::parse_from_rfc3339(&b.updated_at)
            .map(|dt| dt.timestamp())
            .unwrap_or(0);
        b_time.cmp(&a_time)
    });

    Ok(results)
}

#[tauri::command]
fn copy_image_to_vault(
    vault_path: String,
    file_name: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let vault = Path::new(&vault_path);

    if !vault.exists() {
        return Err("Vault does not exist".to_string());
    }

    let images_dir = vault.join("images");

    if !images_dir.exists() {
        fs::create_dir_all(&images_dir)
            .map_err(|e| format!("Failed to create images directory: {}", e))?;
    }

    let safe_name = file_name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>();

    let mut file_path = images_dir.join(&safe_name);
    let mut counter = 1;
    let extension = Path::new(&safe_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");
    let stem = Path::new(&safe_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("image");

    while file_path.exists() {
        file_path = images_dir.join(format!("{}-{}.{}", stem, counter, extension));
        counter += 1;
    }

    let mut file =
        fs::File::create(&file_path).map_err(|e| format!("Failed to create image file: {}", e))?;

    file.write_all(&data)
        .map_err(|e| format!("Failed to write image data: {}", e))?;

    log::info!("Copied image to: {:?}", file_path);

    Ok(file_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    log::info!("Starting Notes App...");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            log::info!("Application setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_vault_state,
            set_vault_path,
            get_vault_path,
            list_vaults,
            create_vault,
            delete_vault,
            remove_vault,
            set_current_vault,
            list_directory,
            create_note,
            read_note,
            save_note,
            delete_note,
            rename_note,
            create_folder,
            delete_folder,
            rename_folder,
            load_all_notes,
            search_notes,
            copy_image_to_vault,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
