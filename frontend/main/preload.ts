import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	on: (
		channel: string,
		callback: (event: IpcRendererEvent, ...args: any[]) => void
	) => {
		ipcRenderer.on(channel, callback);
	},
	send: (channel: string, args?: any) => {
		ipcRenderer.send(channel, args);
	},
	invoke: <T = any>(channel: string, args?: any): Promise<T> => {
		return ipcRenderer.invoke(channel, args);
	}
});
