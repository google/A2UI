import * as Icons from '@douyinfe/semi-icons';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding } from '../../core/hooks';

type IconComponentType = typeof Icons.IconPlus;

// Map A2UI standard icon names to Semi UI icons
// Reference: A2UI specification/0.9/json/standard_catalog_definition.json
const iconMap: Record<string, IconComponentType> = {
  // === A2UI Standard Icons (camelCase) ===
  'accountcircle': Icons.IconUser,
  'add': Icons.IconPlus,
  'arrowback': Icons.IconArrowLeft,
  'arrowforward': Icons.IconArrowRight,
  'attachfile': Icons.IconPaperclip,
  'calendartoday': Icons.IconCalendar,
  'call': Icons.IconPhone,
  'camera': Icons.IconCamera,
  'check': Icons.IconTick,
  'close': Icons.IconClose,
  'delete': Icons.IconDelete,
  'download': Icons.IconDownload,
  'edit': Icons.IconEdit,
  'event': Icons.IconCalendar,
  'error': Icons.IconAlertTriangle,
  'fastforward': Icons.IconFastForward,
  'favorite': Icons.IconLikeHeart,
  'favoriteoff': Icons.IconLikeHeart,
  'folder': Icons.IconFolder,
  'help': Icons.IconHelpCircle,
  'home': Icons.IconHome,
  'info': Icons.IconInfoCircle,
  'locationon': Icons.IconMapPin,
  'lock': Icons.IconLock,
  'lockopen': Icons.IconUnlock,
  'mail': Icons.IconMail,
  'menu': Icons.IconMenu,
  'morevert': Icons.IconMoreStroked,
  'morehoriz': Icons.IconMore,
  'notificationsoff': Icons.IconBellStroked,
  'notifications': Icons.IconBell,
  'pause': Icons.IconPause,
  'payment': Icons.IconCreditCard,
  'person': Icons.IconUser,
  'phone': Icons.IconPhone,
  'photo': Icons.IconImage,
  'play': Icons.IconPlay,
  'print': Icons.IconPrint,
  'refresh': Icons.IconRefresh,
  'rewind': Icons.IconBackward,
  'search': Icons.IconSearch,
  'send': Icons.IconSend,
  'settings': Icons.IconSetting,
  'share': Icons.IconShareStroked,
  'shoppingcart': Icons.IconShoppingBag,
  'skipnext': Icons.IconForward,
  'skipprevious': Icons.IconBackward,
  'star': Icons.IconStar,
  'starhalf': Icons.IconStar,
  'staroff': Icons.IconStarStroked,
  'stop': Icons.IconStop,
  'upload': Icons.IconUpload,
  'visibility': Icons.IconEyeOpened,
  'visibilityoff': Icons.IconEyeClosedSolid,
  'volumedown': Icons.IconVolume1,
  'volumemute': Icons.IconVolumnSilent,
  'volumeoff': Icons.IconVolumnSilent,
  'volumeup': Icons.IconVolume2,
  'warning': Icons.IconAlertCircle,

  // === Additional common aliases ===
  'plus': Icons.IconPlus,
  'user': Icons.IconUser,
  'like': Icons.IconLikeHeart,
  'heart': Icons.IconLikeHeart,
  'success': Icons.IconTickCircle,
  'arrow-left': Icons.IconArrowLeft,
  'arrow-right': Icons.IconArrowRight,
  'arrow-up': Icons.IconArrowUp,
  'arrow-down': Icons.IconArrowDown,
  'chevron-left': Icons.IconChevronLeft,
  'chevron-right': Icons.IconChevronRight,
  'chevron-up': Icons.IconChevronUp,
  'chevron-down': Icons.IconChevronDown,
  'more': Icons.IconMore,
  'copy': Icons.IconCopy,
  'calendar': Icons.IconCalendar,
  'clock': Icons.IconClock,
  'location': Icons.IconMapPin,
  'link': Icons.IconLink,
  'image': Icons.IconImage,
  'video': Icons.IconVideo,
  'file': Icons.IconFile,
};

/**
 * Normalize icon name to match iconMap keys.
 * Handles both camelCase (A2UI spec) and snake_case (Material Icons style).
 * Examples:
 *   - "locationOn" → "locationon"
 *   - "location_on" → "locationon"
 *   - "calendar_today" → "calendartoday"
 */
function normalizeIconName(name: string): string {
  // Remove underscores/hyphens and convert to lowercase
  return name.replace(/[_-]/g, '').toLowerCase();
}

export function Icon({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.IconNode;
  const { name } = node.properties;

  const iconName = useStringBinding(name, component, surfaceId);

  if (!iconName) {
    return null;
  }

  // Normalize icon name to handle both camelCase and snake_case
  const normalizedName = normalizeIconName(iconName);
  const IconComp = iconMap[normalizedName] ?? Icons.IconHelpCircle;

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
  };

  return <span data-id={component.id}><IconComp style={style} /></span>;
}

