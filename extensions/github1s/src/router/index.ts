/**
 * @file GitHub url router (just like react-router)
 * @author netcon
 */

import * as vscode from 'vscode';
import * as github1s from 'github1s';
import { History, createMemoryHistory } from 'history';
import platformAdapterManager from '@/adapters/manager';

export class Router {
	private static instance: Router;

	private _state: github1s.RouterState = null;
	private _history: History = createMemoryHistory();

	public static getInstance() {
		if (Router.instance) {
			return Router.instance;
		}
		return (Router.instance = new Router());
	}

	// we should ensure the router has been initialized at first!
	async initialize(browserUrl: string) {
		const routerParser = await platformAdapterManager.getCurrentAdapter().resolveRouterParser();
		const { path: pathname, query, fragment } = vscode.Uri.parse(browserUrl);
		const path = pathname + (query ? `?${query}` : '') + (fragment ? `#${fragment}` : '');

		this._history.replace(path);
		this._state = await routerParser.parsePath(path);

		this._history.listen(async ({ location }) => {
			const prevState = this._state;
			const targetPath = `${location.pathname}${location.search}${location.hash}`;
			const routerParser = await platformAdapterManager.getCurrentAdapter().resolveRouterParser();
			this._state = await routerParser.parsePath(targetPath);

			// sync path to browser
			vscode.commands.executeCommand('github1s.vscode.replace-browser-url', targetPath);
		});
	}

	// get the routerState for current url
	public getState(): github1s.RouterState {
		return this._state;
	}

	// compute the file URI authority of current routerState
	public getAuthority(): string {
		return `${this._state.repo}+${this._state.ref}`;
	}

	public push(path: string) {
		return this._history.push(path);
	}

	// replace the url of the history
	public replace(path: string) {
		return this._history.replace(path);
	}
}

export default Router.getInstance();
