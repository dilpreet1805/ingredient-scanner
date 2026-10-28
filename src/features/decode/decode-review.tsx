import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { colors } from "@/constants/colors";
import { AdditiveList } from "@/features/additives/additive-list";

import { useCaptureDraft } from "./capture-draft";
import { decodeLabel } from "./decode-client";
import { mergeDrafts, toDraft, type Draft } from "./draft";
import { draftToNewScan } from "./new-scan";
import { NutritionCard } from "./nutrition-card";
import { outcomeMessage, type FailedDecode } from "./outcome-message";
import { prepareLabelPhoto } from "./prepare-photo";
import { runDecode } from "./run-decode";
import { scanTitle } from "./scan-text";
import { useCreateScan } from "./use-scans";
import { usePhotoCapture } from "./use-photo-capture";
import { warningText } from "./warning-text";

const deps = { prepare: prepareLabelPhoto, decode: decodeLabel };

type Source = "camera" | "gallery";

type Phase =
  | { name: "reading"; uri: string }
  | { name: "failed"; outcome: FailedDecode }
  | { name: "result"; draft: Draft };

export function DecodeReview() {
  // The first photo, chosen on the Decode tab. (The store's name is from the old two-photo design.)
  const firstUri = useCaptureDraft((s) => s.ingredientsUri);
  const reset = useCaptureDraft((s) => s.reset);
  const { cameraBlocked, takePhoto, pickPhoto } = usePhotoCapture();
  const createScan = useCreateScan();

  const [phase, setPhase] = useState<Phase>({
    name: "reading",
    uri: firstUri ?? "",
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<FailedDecode | null>(null);
  const [typedName, setTypedName] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const started = useRef(false);

  const pick = (source: Source) =>
    source === "camera" ? takePhoto() : pickPhoto();

  // Reads one photo as the start of a new decode.
  const read = useCallback(async (uri: string) => {
    setMismatch(false);
    setSaveError(null);
    setPhase({ name: "reading", uri });
    try {
      const out = await runDecode(uri, deps);
      setPhase(
        out.kind === "read"
          ? { name: "result", draft: toDraft(out) }
          : { name: "failed", outcome: out },
      );
    } catch (error) {
      console.error(error); // a bug, not an expected failure: keep it visible in development
      setPhase({ name: "failed", outcome: { kind: "unavailable" } });
    }
  }, []);

  // Runs once when the screen opens. The ref stops a second run in development.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!firstUri) {
      router.back();
      return;
    }
    void read(firstUri);
  }, [firstUri, read]);

  const retake = async (source: Source) => {
    const uri = await pick(source);
    if (uri) void read(uri);
  };

  // A second photo of the same product, merged into what we already have.
  const addPhoto = async (source: Source, draft: Draft) => {
    const uri = await pick(source);
    if (!uri) return;
    setAdding(true);
    setAddError(null);
    try {
      const out = await runDecode(uri, deps);
      if (out.kind === "read") {
        setPhase({ name: "result", draft: mergeDrafts(draft, toDraft(out)) });
      } else {
        setAddError(out);
      }
    } catch (error) {
      console.error(error);
      setAddError({ kind: "unavailable" });
    } finally {
      setAdding(false);
    }
  };

  const save = async (draft: Draft, confirmed: boolean) => {
    if (createScan.isPending) return; // a second tap must not save a second copy
    const scan = draftToNewScan(draft, { confirmed, typedName });
    if (!scan) {
      setSaveError("We can't save a scan without an ingredient list.");
      return;
    }
    setSaveError(null);
    try {
      const id = await createScan.mutateAsync(scan);
      reset();
      // replace, so Back from the report goes to Decode, not to this screen.
      router.replace({ pathname: "/decode/[id]", params: { id } });
    } catch (error) {
      console.error(error);
      setSaveError("We couldn't save this scan. Please try again.");
    }
  };

  return (
    <Screen>
      <BackButton />
      <AppText variant="heading">Decode</AppText>

      {phase.name === "reading" && <Reading uri={phase.uri} />}

      {phase.name === "failed" && (
        <Failed
          outcome={phase.outcome}
          cameraBlocked={cameraBlocked}
          onTake={() => retake("camera")}
          onPick={() => retake("gallery")}
          onBack={() => router.back()}
        />
      )}

      {phase.name === "result" && (
        <Result
          draft={phase.draft}
          adding={adding}
          addError={addError}
          cameraBlocked={cameraBlocked}
          onTake={() => addPhoto("camera", phase.draft)}
          onPick={() => addPhoto("gallery", phase.draft)}
          typedName={typedName}
          onTypedName={setTypedName}
          mismatch={mismatch}
          onMismatch={() => setMismatch(true)}
          onRetake={retake}
          saving={createScan.isPending}
          saveError={saveError}
          onSave={(confirmed) => save(phase.draft, confirmed)}
        />
      )}
    </Screen>
  );
}

function Photo({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      accessibilityLabel="Your label photo"
      style={{
        width: "100%",
        height: 200,
        borderRadius: 16,
        backgroundColor: colors.primarySoft,
      }}
    />
  );
}

function Reading({ uri }: { uri: string }) {
  return (
    <Card className="gap-3">
      <Photo uri={uri} />
      <View className="flex-row items-center gap-3">
        <ActivityIndicator color={colors.primary} />
        <AppText variant="body">Reading the label…</AppText>
      </View>
      <AppText variant="caption">This usually takes 10 to 15 seconds.</AppText>
    </Card>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex-row items-start gap-3 bg-accent-soft">
      <Ionicons name="alert-circle" size={22} color={colors.accentStrong} />
      <View className="flex-1 gap-1">
        <AppText variant="body" className="font-body-bold text-forest">
          {title}
        </AppText>
        <AppText variant="caption" className="text-ink">
          {body}
        </AppText>
      </View>
    </Card>
  );
}

function ErrorNote({ outcome }: { outcome: FailedDecode }) {
  const message = outcomeMessage(outcome);
  return <Note title={message.title} body={message.body} />;
}

function PhotoButtons(props: {
  cameraBlocked: boolean;
  busy?: boolean;
  onTake: () => void;
  onPick: () => void;
}) {
  return (
    <View className="gap-2">
      {props.cameraBlocked ? (
        <Button
          title="Open settings"
          variant="cta"
          onPress={() => Linking.openSettings()}
        />
      ) : (
        <Button
          title="Take photo"
          variant="cta"
          loading={props.busy}
          onPress={props.onTake}
        />
      )}
      <Button
        title="Choose from gallery"
        variant="soft"
        loading={props.busy}
        onPress={props.onPick}
      />
    </View>
  );
}

function Failed(props: {
  outcome: FailedDecode;
  cameraBlocked: boolean;
  onTake: () => void;
  onPick: () => void;
  onBack: () => void;
}) {
  const { canRetake } = outcomeMessage(props.outcome);
  return (
    <>
      <ErrorNote outcome={props.outcome} />
      {canRetake ? (
        <PhotoButtons
          cameraBlocked={props.cameraBlocked}
          onTake={props.onTake}
          onPick={props.onPick}
        />
      ) : (
        <Button title="Back to Decode" variant="soft" onPress={props.onBack} />
      )}
    </>
  );
}

function Result(props: {
  draft: Draft;
  adding: boolean;
  addError: FailedDecode | null;
  cameraBlocked: boolean;
  onTake: () => void;
  onPick: () => void;
  typedName: string;
  onTypedName: (value: string) => void;
  mismatch: boolean;
  onMismatch: () => void;
  onRetake: (source: Source) => void;
  saving: boolean;
  saveError: string | null;
  onSave: (confirmed: boolean) => void;
}) {
  const { draft } = props;
  const { reading, missing, warnings } = draft;
  const noIngredients = missing.includes("ingredients");
  const noNutrition = missing.includes("nutrition");
  const isSupplement = reading.category === "supplement";
  const needsName =
    !(reading.brand ?? "").trim() && !(reading.productName ?? "").trim();

  const photos = draft.photoUris.map((uri) => <Photo key={uri} uri={uri} />);

  // Without ingredients there is no result yet: ask for that photo and stop here.
  if (noIngredients) {
    return (
      <>
        <Card className="gap-3">{photos}</Card>
        <Card className="gap-3">
          <AppText variant="title">We couldn't see the ingredient list</AppText>
          <AppText variant="caption">
            Take a photo of the ingredient list. It's usually on the back or the
            side of the pack.
          </AppText>
          <PhotoButtons
            cameraBlocked={props.cameraBlocked}
            busy={props.adding}
            onTake={props.onTake}
            onPick={props.onPick}
          />
        </Card>
        {props.addError && <ErrorNote outcome={props.addError} />}
      </>
    );
  }

  return (
    <>
      <Card className="gap-3">
        {photos}
        <AppText variant="title" numberOfLines={3}>
          {scanTitle(reading)}
        </AppText>
      </Card>

      {needsName && (
        <Card className="gap-2">
          <TextField
            label="What is this product called?"
            value={props.typedName}
            onChangeText={props.onTypedName}
            placeholder="e.g. Tomato ketchup"
            autoCorrect={false}
          />
          <AppText variant="caption">
            We couldn't read a name on the label. This is optional.
          </AppText>
        </Card>
      )}

      <Card className="gap-2">
        <AppText variant="title">Ingredients</AppText>
        <AppText variant="body">{reading.ingredientsText}</AppText>
      </Card>

      <Card>
        <AdditiveList ingredientsText={reading.ingredientsText ?? ""} />
      </Card>

      {reading.allergenStatements.length > 0 && (
        <Card className="gap-2">
          <AppText variant="title">Allergen information</AppText>
          {reading.allergenStatements.map((line) => (
            <AppText key={line} variant="body">
              {line}
            </AppText>
          ))}
        </Card>
      )}

      {reading.nutrition ? (
        <NutritionCard
          nutrition={reading.nutrition}
          servingSize={reading.servingSize}
          note="Read from your photo. Check the numbers against the pack."
        />
      ) : isSupplement ? (
        <Card className="gap-1">
          <AppText variant="title">Vitamins and minerals</AppText>
          <AppText variant="caption">
            Vitamins and minerals aren't read yet.
          </AppText>
        </Card>
      ) : null}

      {warnings.length > 0 && (
        <Card className="gap-2 bg-accent-soft">
          {warnings.map((code) => (
            <AppText key={code} variant="caption" className="text-ink">
              {warningText(code)}
            </AppText>
          ))}
        </Card>
      )}

      {noNutrition && !isSupplement && (
        <Card className="gap-3">
          <AppText variant="title">Want calories and macros?</AppText>
          <AppText variant="caption">
            Add a photo of the nutrition facts. This is optional.
          </AppText>
          <PhotoButtons
            cameraBlocked={props.cameraBlocked}
            busy={props.adding}
            onTake={props.onTake}
            onPick={props.onPick}
          />
        </Card>
      )}
      {props.addError && <ErrorNote outcome={props.addError} />}

      <Card className="gap-3">
        <AppText variant="title">Does this match the pack?</AppText>
        <AppText variant="caption">
          Compare the ingredients and numbers above with the label.
        </AppText>
        <Button
          title="Yes, save it"
          variant="cta"
          loading={props.saving}
          onPress={() => props.onSave(true)}
        />
        <Button
          title="Something's different"
          variant="soft"
          disabled={props.saving}
          onPress={props.onMismatch}
        />
      </Card>

      {props.mismatch && (
        <Card className="gap-3">
          <AppText variant="title">Try a clearer photo</AppText>
          <AppText variant="caption">
            Get closer so the text fills the frame, and hold the phone straight
            above the label. A new photo uses another decode.
          </AppText>
          <PhotoButtons
            cameraBlocked={props.cameraBlocked}
            onTake={() => props.onRetake("camera")}
            onPick={() => props.onRetake("gallery")}
          />
          <Button
            title="Save without confirming"
            variant="soft"
            disabled={props.saving}
            onPress={() => props.onSave(false)}
          />
        </Card>
      )}

      {props.saveError && (
        <Note title="Couldn't save" body={props.saveError} />
      )}
    </>
  );
}
