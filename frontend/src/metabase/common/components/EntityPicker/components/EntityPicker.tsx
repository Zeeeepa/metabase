import { EntityPickerProvider } from "../context"
import type { EntityPickerProps, OmniPickerItem, OmniPickerValue } from "../types"

import { ButtonBar } from "./ButtonBar"
import { NestedItemPicker } from "./NestedItemPicker"


export function EntityPicker(props: EntityPickerProps) {
  return (
    <EntityPickerProvider value={props}>
      <NestedItemPicker />
      {props.options.hasConfirmButtons && (
        <ButtonBar
          onConfirm={props.onChange}
          onCancel={props.onClose}
          actionButtons={props.options.actionButtons}
          confirmButtonText={props.options.confirmButtonText}
          cancelButtonText={props.options.cancelButtonText}
        />
      )}
    </EntityPickerProvider>
  )
}
