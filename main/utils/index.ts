import { nativeImage, type NativeImage } from "electron";
import { CONFIG_KEYS } from "@common/constants";
import configManager from "../service/ConfigService";
import path from "node:path";

import en from '@locales/en.json';
import zh from '@locales/zh.json';

type MessageSchema = typeof zh
const messages: Record<string, MessageSchema> = { en, zh }

export function createTranslator() {
  return (key?: string) => {
    if (!key) return void 0;
    try {
      const keys = key.split('.');
      let result: any = messages[configManager.get(CONFIG_KEYS.LANGUAGE)];
      for (const _key of keys) {
        result = result[_key];
      }
      return result as string;
    } catch (_e) {
      console.warn('failed to translate key: ', key);
      return key;
    }
  }
}

let logo: NativeImage | void;
export function createLogo() {
  if (logo != null) {
    return logo;
  }
  logo = nativeImage.createFromPath(path.join(__dirname, 'noel_icon.png'));
  return logo;
}
