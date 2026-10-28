import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";

import type { AdditiveEntry, Source, Statement } from "./additive-table";
import { describeAdditives } from "./describe-additives";

function Statements({ title, items }: { title: string; items: Statement[] }) {
  if (items.length === 0) return null;
  return (
    <View className="gap-1">
      <AppText variant="caption" className="font-body-bold text-forest">
        {title}
      </AppText>
      {items.map((item) => (
        <AppText key={item.text} variant="caption" className="text-ink">
          {item.text}
        </AppText>
      ))}
    </View>
  );
}

// Every source behind an entry, once each.
function uniqueSources(entry: AdditiveEntry): Source[] {
  const byUrl = new Map<string, Source>();
  for (const statement of [entry.purpose, ...entry.rules, ...entry.awareness]) {
    for (const source of statement.sources) byUrl.set(source.url, source);
  }
  return [...byUrl.values()];
}

function EntryDetails({ entry }: { entry: AdditiveEntry }) {
  return (
    <View className="gap-3 pb-3">
      <Statements title="What it does" items={[entry.purpose]} />
      <Statements title="What regulators say" items={entry.rules} />
      <Statements title="Worth knowing" items={entry.awareness} />
      <View className="gap-2">
        <AppText variant="caption" className="font-body-bold text-forest">
          Sources
        </AppText>
        {uniqueSources(entry).map((source) => (
          <Pressable
            key={source.url}
            accessibilityRole="link"
            onPress={() => {
              void Linking.openURL(source.url).catch(() => {});
            }}
            className="active:opacity-70"
          >
            <AppText variant="caption" className="text-forest underline">
              {source.title}
            </AppText>
            <AppText variant="caption">Checked {source.checkedOn}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function AdditiveList({ ingredientsText }: { ingredientsText: string }) {
  const found = describeAdditives(ingredientsText);
  const [openCode, setOpenCode] = useState<string | null>(null);

  return (
    <View className="gap-1">
      <AppText variant="title">
        {found.length > 0 ? `Additives (${found.length})` : "Additives"}
      </AppText>

      {found.length === 0 ? (
        <AppText variant="caption">
          No additive codes were found in the ingredients.
        </AppText>
      ) : (
        <>
          {found.map(({ code, entry }, index) => {
            const open = openCode === code;
            return (
              <View
                key={code}
                className={cn(
                  index < found.length - 1 && "border-b border-primary-soft",
                )}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => setOpenCode(open ? null : code)}
                  className="flex-row items-center gap-2 py-3 active:opacity-70"
                >
                  <View className="flex-1">
                    <AppText variant="body" className="font-body-semibold">
                      {entry ? `INS ${code} · ${entry.name}` : `INS ${code}`}
                    </AppText>
                    <AppText variant="caption">
                      {entry ? entry.group : "No information yet"}
                    </AppText>
                  </View>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>

                {open &&
                  (entry ? (
                    <EntryDetails entry={entry} />
                  ) : (
                    <AppText variant="caption" className="pb-3">
                      We don't have information on this additive yet. The label
                      lists it as INS {code}.
                    </AppText>
                  ))}
              </View>
            );
          })}
          <AppText variant="caption" className="pt-2">
            These notes report what regulators and expert bodies have
            published. They are general information, not advice about what you
            should eat.
          </AppText>
        </>
      )}
    </View>
  );
}
