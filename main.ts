import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, MarkdownView, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface AtMentionSettings {
    autocompleteTriggerPhrase: string;
}

const DEFAULT_SETTINGS: AtMentionSettings = {
    autocompleteTriggerPhrase: '@'
}

export default class AtMentionPlugin extends Plugin {
    settings: AtMentionSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'sample-editor-command',
            name: 'Sample editor command',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                console.log(editor.getSelection());
                editor.replaceSelection('Sample Editor Command');
            }
        });
        this.registerEditorSuggest(new PersonSuggest(this.app, this));
        this.addSettingTab(new AtMentionSettingTab(this.app, this));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class AtMentionSettingTab extends PluginSettingTab {
    plugin: AtMentionPlugin;

    constructor(app: App, plugin: AtMentionPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Trigger phrase')
            .setDesc('Character(s) that trigger the autocomplete')
            .addText(text => text
			.setPlaceholder('@')
			.setValue(this.plugin.settings.autocompleteTriggerPhrase)
			.onChange(async (value) => {
				this.plugin.settings.autocompleteTriggerPhrase = value;
				await this.plugin.saveSettings();
			}));
    }
}

interface IPersonCompletion {
    label: string;
}

class PersonSuggest extends EditorSuggest<IPersonCompletion> {
	plugin: AtMentionPlugin;

	constructor(app: App, plugin: AtMentionPlugin) {
		super(app);
		this.plugin = plugin;
	}

    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
		const triggerPhrase = this.plugin.settings.autocompleteTriggerPhrase;

		const startPos = this.context?.start || {
			line: cursor.line,
			ch: cursor.ch - triggerPhrase.length,
		};

		if (!editor.getRange(startPos, cursor).startsWith(triggerPhrase)) {
			return null;
		}

		const precedingChar = editor.getRange(
			{
				line: startPos.line,
				ch: startPos.ch - 1,
			},
			startPos
		);

		// Short-circuit if `@` as a part of a word (e.g. part of an email address)
		if (precedingChar && /[`a-zA-Z0-9]/.test(precedingChar)) {
			return null;
		}

		return {
			start: startPos,
			end: cursor,
			query: editor.getRange(startPos, cursor).substring(triggerPhrase.length),
		};
    }

	getSuggestions(context: EditorSuggestContext): IPersonCompletion[] {
		return [
			{ label: 'Alice' },
			{ label: 'Bob' },
			{ label: 'Charlie' },
		];
	}

	renderSuggestion(value: IPersonCompletion, el: HTMLElement): void {
		el.setText(value.label);
	}

	selectSuggestion(item: IPersonCompletion): void {
		const editor = this.context?.editor;
		if (editor) {
			editor.replaceSelection(`@${item.label}`);
			return;
		}
	}
}
