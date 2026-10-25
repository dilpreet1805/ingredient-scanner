import {
    Controller,
    type Control,
    type FieldValues,
    type Path,
} from "react-hook-form";

import { TextField, type TextFieldProps } from "./text-field";

type Props<T extends FieldValues> = Omit<
  TextFieldProps,
  "value" | "onChangeText" | "onBlur"
> & {
  control: Control<T>;
  name: Path<T>;
};

export function FormField<T extends FieldValues>({
  control,
  name,
  ...rest
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...rest}
          value={String(field.value ?? "")}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
