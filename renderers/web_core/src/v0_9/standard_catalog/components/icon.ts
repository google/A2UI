
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';

import { CommonTypes } from '../../catalog/schema_types.js';

export interface IconRenderProps {
  name: string | any; // Supports string name, { icon, font }, or { path }
  weight?: number;
}

const iconSchema = z.object({
  name: z.union([
      z.enum([
        "accountCircle", "add", "arrowBack", "arrowForward", "attachFile", "calendarToday", "call", "camera", "check", "close", "delete", "download", "edit", "event", "error", "fastForward", "favorite", "favoriteOff", "folder", "help", "home", "info", "locationOn", "lock", "lockOpen", "mail", "menu", "moreVert", "moreHoriz", "notificationsOff", "notifications", "pause", "payment", "person", "phone", "photo", "play", "print", "refresh", "rewind", "search", "send", "settings", "share", "shoppingCart", "skipNext", "skipPrevious", "star", "starHalf", "starOff", "stop", "upload", "visibility", "visibilityOff", "volumeDown", "volumeMute", "volumeOff", "volumeUp", "warning"
      ]),
      z.object({ path: z.string() })
  ]).describe("The name of the icon to display."),
  weight: CommonTypes.Weight.optional()
});

export class IconComponent<T> implements Component<T> {
  readonly name = 'Icon';
  readonly schema = iconSchema;

  constructor(private readonly renderer: (props: IconRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const nameProp = properties['name'];
    let name: any = '';

    if (typeof nameProp === 'string') {
      name = nameProp; // Can be dynamic resolution later if needed
    } else if (typeof nameProp === 'object') {
      name = nameProp; // Pass through object (e.g. { icon, font } or { path })
    }
    const weight = properties['weight'] as number | undefined;

    return this.renderer({ name, weight }, context);
  }
}
