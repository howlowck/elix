// Elix is a JavaScript project, but we define TypeScript declarations so we can
// confirm our code is type safe, and to support TypeScript users.

import MenuButton from './MenuButton.js';
import SelectedItemTextValueMixin from './SelectedItemTextValueMixin.js';
import SingleSelectionMixin from './SingleSelectionMixin.js';
import SlotItemsMixin from './SlotItemsMixin.js';

export default class DropdownList extends
    SelectedItemTextValueMixin(
    SingleSelectionMixin(
    SlotItemsMixin(
      MenuButton
    ))) {
  defaultMenuSelectedIndex: number;
  valueRole: Role;
}
