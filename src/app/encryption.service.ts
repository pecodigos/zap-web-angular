import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private secretKey: string = environment.secretKey || 'default-key';

  encrypt(message: string): string {
    return CryptoJS.AES.encrypt(message, this.secretKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  constructor() { }
}
