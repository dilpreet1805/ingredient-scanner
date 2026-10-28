import { router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { partsFromDate } from "./age-policy";
import { useAgeStore } from "./age-store";

const MIN_DATE = new Date(1900, 0, 1);

const longDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function DobStep() {
  const submit = useAgeStore((s) => s.submit);
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (chosen: Date) => {
    setBusy(true);
    const result = await submit(partsFromDate(chosen));
    setBusy(false);
    if (!result.ok) {
      setError("That date doesn't look right. Please choose it again.");
      return;
    }
    // A teen goes to Decode. An adult stays here and the screen then shows the profile form.
    // Someone under 11 sees the "not available" screen.
    if (result.tier === "teen") router.replace("/decode");
  };

  const onContinue = () => {
    if (!date) {
      setError("Choose your date of birth.");
      return;
    }
    setError(null);
    Alert.alert(
      "Is this correct?",
      `You chose ${longDate(date)}. Please check that it is right.`,
      [
        { text: "Edit", style: "cancel" },
        { text: "Confirm", onPress: () => void save(date) },
      ],
    );
  };

  return (
    <View className="gap-4">
      <View className="gap-1">
        <AppText variant="heading">Welcome</AppText>
        <AppText variant="caption">First, your date of birth.</AppText>
      </View>

      <Card className="gap-4">
        <DateField
          label="Date of birth"
          value={date}
          onChange={(chosen) => {
            setDate(chosen);
            setError(null);
          }}
          minimumDate={MIN_DATE}
          maximumDate={new Date()}
          error={error ?? undefined}
        />
        <Button
          title="Continue"
          variant="cta"
          loading={busy}
          onPress={onContinue}
        />
        <AppText variant="caption">
          We use your date once, on this phone, to choose the right version of
          the app. We never keep the full date and we don't send it anywhere.
          For adults, your birth year is saved in your profile for your calorie
          estimate.
        </AppText>
      </Card>
    </View>
  );
}
