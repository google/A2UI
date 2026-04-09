import { config as restaurantConfig } from "./restaurant.js";
import { config as contactsConfig } from "./contacts.js";
import { AppConfig } from "./types.js";

export const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
  contacts: contactsConfig,
};

export type { AppConfig };
