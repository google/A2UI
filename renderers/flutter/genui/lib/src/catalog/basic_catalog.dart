// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../model/catalog.dart';
import '../model/catalog_item.dart';
import '../primitives/constants.dart';
import 'basic_catalog_widgets/audio_player.dart' as audio_player_item;
import 'basic_catalog_widgets/button.dart' as button_item;
import 'basic_catalog_widgets/card.dart' as card_item;
import 'basic_catalog_widgets/check_box.dart' as check_box_item;
import 'basic_catalog_widgets/choice_picker.dart' as choice_picker_item;
import 'basic_catalog_widgets/column.dart' as column_item;
import 'basic_catalog_widgets/date_time_input.dart' as date_time_input_item;
import 'basic_catalog_widgets/divider.dart' as divider_item;
import 'basic_catalog_widgets/icon.dart' as icon_item;
import 'basic_catalog_widgets/image.dart' as image_item;
import 'basic_catalog_widgets/list.dart' as list_item;
import 'basic_catalog_widgets/modal.dart' as modal_item;
import 'basic_catalog_widgets/row.dart' as row_item;
import 'basic_catalog_widgets/slider.dart' as slider_item;
import 'basic_catalog_widgets/tabs.dart' as tabs_item;
import 'basic_catalog_widgets/text.dart' as text_item;
import 'basic_catalog_widgets/text_field.dart' as text_field_item;
import 'basic_catalog_widgets/video.dart' as video_item;
import 'basic_functions.dart';

/// A collection of basic catalog items that can be used to build simple
/// interactive UIs.
abstract final class BasicCatalogItems {
  BasicCatalogItems._();

  /// A UI element for playing audio content.
  ///
  /// This typically includes controls like play/pause, seek, and volume.
  static final CatalogItem audioPlayer = audio_player_item.audioPlayer;

  /// An interactive button that triggers an action when pressed.
  ///
  /// Conforms to Material Design guidelines for elevated buttons.
  static final CatalogItem button = button_item.button;

  /// A Material Design card, a container for related information and
  /// actions.
  ///
  /// Often used to group content visually.
  static final CatalogItem card = card_item.card;

  /// A checkbox that allows the user to toggle a boolean state.
  static final CatalogItem checkBox = check_box_item.checkBox;

  /// A layout widget that arranges its children in a vertical
  /// sequence.
  static final CatalogItem column = column_item.column;

  /// A widget for selecting a date and/or time.
  static final CatalogItem dateTimeInput = date_time_input_item.dateTimeInput;

  /// A thin horizontal line used to separate content.
  static final CatalogItem divider = divider_item.divider;

  /// An icon.
  static final CatalogItem icon = icon_item.icon;

  /// A UI element for displaying image data from a URL or other
  /// source.
  static final CatalogItem image = image_item.image;

  /// A scrollable list of child widgets.
  ///
  /// Can be configured to lay out items linearly.
  static final CatalogItem list = list_item.list;

  /// A modal overlay that slides up from the bottom of the screen.
  ///
  /// Used to present a set of options or a piece of content requiring user
  /// interaction.
  static final CatalogItem modal = modal_item.modal;

  /// A widget allowing the user to select one or more options from a
  /// list.
  static final CatalogItem choicePicker = choice_picker_item.choicePicker;

  /// A layout widget that arranges its children in a horizontal
  /// sequence.
  static final CatalogItem row = row_item.row;

  /// A slider control for selecting a value from a range.
  static final CatalogItem slider = slider_item.slider;

  /// A set of tabs for navigating between different views or
  /// sections.
  static final CatalogItem tabs = tabs_item.tabs;

  /// A block of styled text.
  static final CatalogItem text = text_item.text;

  /// An input field where the user can enter text.
  static final CatalogItem textField = text_field_item.textField;

  /// A UI element for playing video content.
  ///
  /// This typically includes controls like play/pause, seek, and volume.
  static final CatalogItem video = video_item.video;

  /// Creates a catalog containing all core catalog items.
  static Catalog asCatalog() {
    return Catalog(
      [
        audioPlayer,
        button,
        card,
        checkBox,
        column,
        dateTimeInput,
        divider,
        icon,
        image,
        list,
        modal,
        choicePicker,
        row,
        slider,
        tabs,
        text,
        textField,
        video,
      ],
      functions: BasicFunctions.all,
      catalogId: basicCatalogId,
    );
  }
}
