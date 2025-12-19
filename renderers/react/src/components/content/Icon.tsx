/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import React, { useMemo } from "react";
import { Types } from "@a2ui/lit/0.8";
import * as LucideIcons from "lucide-react";
import { useDataBinding } from "../../hooks/useDataBinding.js";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

const iconMap: Record<string, keyof typeof LucideIcons> = {
  accountCircle: "UserCircle",
  add: "Plus",
  arrowBack: "ArrowLeft",
  arrowForward: "ArrowRight",
  attachFile: "Paperclip",
  calendarToday: "Calendar",
  call: "Phone",
  camera: "Camera",
  check: "Check",
  close: "X",
  delete: "Trash2",
  download: "Download",
  edit: "Pencil",
  event: "CalendarDays",
  error: "AlertCircle",
  favorite: "Heart",
  favoriteOff: "HeartOff",
  folder: "Folder",
  help: "HelpCircle",
  home: "Home",
  info: "Info",
  locationOn: "MapPin",
  lock: "Lock",
  lockOpen: "Unlock",
  mail: "Mail",
  menu: "Menu",
  moreVert: "MoreVertical",
  moreHoriz: "MoreHorizontal",
  notificationsOff: "BellOff",
  notifications: "Bell",
  payment: "CreditCard",
  person: "User",
  phone: "Phone",
  photo: "Image",
  print: "Printer",
  refresh: "RefreshCw",
  search: "Search",
  send: "Send",
  settings: "Settings",
  share: "Share2",
  shoppingCart: "ShoppingCart",
  star: "Star",
  starHalf: "StarHalf",
  starOff: "StarOff",
  thumbUp: "ThumbsUp",
  thumbDown: "ThumbsDown",
  upload: "Upload",
  visibility: "Eye",
  visibilityOff: "EyeOff",
  warning: "AlertTriangle",
};

interface IconProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Icon" };
}

export function Icon({ node, surfaceId }: IconProps) {
  const theme = useTheme();
  const { resolveString } = useDataBinding(node, surfaceId);

  const properties = node.properties as {
    name?: { literalString?: string; path?: string };
  };

  const iconName = resolveString(properties.name ?? null) ?? "";

  const themeClasses = useMemo(() => {
    const iconTheme = theme.components.Icon as Record<string, unknown>;
    if (iconTheme && typeof iconTheme === "object" && "element" in iconTheme) {
      return classMapToString(iconTheme.element as Record<string, boolean>);
    }
    return classMapToString(theme.components.Icon);
  }, [theme]);

  const containerClasses = useMemo(() => {
    const iconTheme = theme.components.Icon as Record<string, unknown>;
    if (iconTheme && typeof iconTheme === "object" && "container" in iconTheme) {
      return classMapToString(iconTheme.container as Record<string, boolean>);
    }
    return "";
  }, [theme]);

  const IconComponent = useMemo(() => {
    const lucideIconName = iconMap[iconName];
    if (lucideIconName && lucideIconName in LucideIcons) {
      return LucideIcons[lucideIconName] as LucideIcons.LucideIcon;
    }
    return LucideIcons.HelpCircle;
  }, [iconName]);

  if (containerClasses) {
    return (
      <div className={cn(containerClasses)}>
        <IconComponent className={cn(themeClasses)} />
      </div>
    );
  }

  return <IconComponent className={cn(themeClasses)} />;
}
