import DateTimePicker, {
    DateTimePickerAndroid,
    type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./app-text";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate: Date;
  maximumDate: Date;
  placeholder?: string;
  error?: string;
};

const longDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder = "Select a date",
  error,
}: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const text = value ? longDate(value) : placeholder;

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "set" && selected) onChange(selected);
  };

  const open = () => {
    if (Platform.OS === "android") {
      // The calendar dialog. Tapping the year at the top shows a list of years.
      DateTimePickerAndroid.open({
        value: value ?? maximumDate,
        mode: "date",
        minimumDate,
        maximumDate,
        onChange: handleChange,
      });
    } else {
      setIosOpen((current) => !current);
    }
  };

  return (
    <View className="gap-1.5">
      <AppText variant="body" className="font-body-semibold text-forest">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
        onPress={open}
        className={cn(
          "min-h-[52px] justify-center rounded-control border bg-canvas px-4 active:opacity-80",
          error ? "border-risk-high" : "border-primary-soft",
        )}
      >
        <AppText variant="body" className={value ? "text-ink" : "text-muted"}>
          {text}
        </AppText>
      </Pressable>

      {Platform.OS === "ios" && iosOpen && (
        <DateTimePicker
          value={value ?? maximumDate}
          mode="date"
          display="inline"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}

      {error && (
        <AppText variant="caption" className="text-risk-high">
          {error}
        </AppText>
      )}
    </View>
  );
}
