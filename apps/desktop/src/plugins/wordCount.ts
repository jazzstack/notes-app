import { Plugin, PluginAPI } from '@notes-app/shared';

export const wordCountPlugin: Plugin = {
  id: 'word-count',
  name: 'Word Count',
  version: '1.0.0',
  description: 'Shows word and character count for the current note',
  author: 'Notes App',
  enabled: false,

  onLoad: (api: PluginAPI) => {
    api.registerCommand({
      id: 'word-count',
      name: 'Insert Word Count',
      action: () => {
        const context = api.getNoteContext();
        const text = context.content;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        
        alert(`Word Count:\n- Words: ${words}\n- Characters: ${chars}\n- Characters (no spaces): ${charsNoSpaces}`);
      },
    });

    api.addTopBarButton({
      id: 'word-count',
      icon: 'zoom-in',
      title: 'Word Count',
      action: () => {
        const context = api.getNoteContext();
        const text = context.content;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        
        alert(`Word Count:\n- Words: ${words}\n- Characters: ${chars}`);
      },
      position: 'right',
    });

    api.addEditorHook({
      onContentChange: (content: string) => {
        console.log('[Word Count Plugin] Content changed, current word count:', 
          content.trim().split(/\s+/).filter(Boolean).length);
      },
    });
  },
};
