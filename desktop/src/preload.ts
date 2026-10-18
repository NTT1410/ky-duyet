import { contextBridge, ipcRenderer } from 'electron';

export interface TokenDetectionResult {
  connected: boolean;
  tokens: Array<{
    subject: string;
    issuer: string;
    serialNumber: string;
    validFrom: string;
    validTo: string;
    provider: string;
  }>;
  message: string;
}

export interface TokenSignParams {
  docHash: string;
  serialNumber?: string;
  tokenPin: string;
  tokenProvider?: string;
}

export interface TokenSignResult {
  success: boolean;
  signature?: string;
  certInfo?: any;
  message?: string;
}

// Expose safe APIs to the web window
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  detectUsbTokens: (): Promise<TokenDetectionResult> => ipcRenderer.invoke('usb-token:detect'),
  signWithUsbToken: (params: TokenSignParams): Promise<TokenSignResult> => ipcRenderer.invoke('usb-token:sign', params),
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  checkUpdate: (manual: boolean = true): Promise<any> => ipcRenderer.invoke('app:check-update', manual),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('app:open-external', url),
});
