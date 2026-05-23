import { createBike, deleteBike, getBike, updateBike } from "@athmira/supabase";
import type { BikeType } from "@athmira/types";
import { Body, Button, Card, Field, Heading, Inline, colors, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage, parseOptionalNumber } from "@/utils/form";

import { BikeTypeSelector } from "./BikeTypeSelector";

type BikeFormScreenProps = {
  bikeId?: string;
};

export function BikeFormScreen({ bikeId }: BikeFormScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [bikeType, setBikeType] = useState<BikeType>("road");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [size, setSize] = useState("");
  const [saddleHeight, setSaddleHeight] = useState("");
  const [saddleSetback, setSaddleSetback] = useState("");
  const [stemLength, setStemLength] = useState("");
  const [crankLength, setCrankLength] = useState("");
  const [handlebarWidth, setHandlebarWidth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !bikeId) {
      return;
    }

    const currentUser = user;
    const selectedBikeId = bikeId;
    let cancelled = false;

    async function loadBike() {
      try {
        const bike = await getBike(currentUser.id, selectedBikeId);

        if (!bike || cancelled) {
          return;
        }

        setName(bike.name);
        setBikeType(bike.bike_type);
        setBrand(bike.brand ?? "");
        setModel(bike.model ?? "");
        setSize(bike.size ?? "");
        setSaddleHeight(bike.saddle_height_mm == null ? "" : String(bike.saddle_height_mm));
        setSaddleSetback(bike.saddle_setback_mm == null ? "" : String(bike.saddle_setback_mm));
        setStemLength(bike.stem_length_mm == null ? "" : String(bike.stem_length_mm));
        setCrankLength(bike.crank_length_mm == null ? "" : String(bike.crank_length_mm));
        setHandlebarWidth(bike.handlebar_width_mm == null ? "" : String(bike.handlebar_width_mm));
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      }
    }

    loadBike();

    return () => {
      cancelled = true;
    };
  }, [bikeId, user]);

  async function saveBike() {
    if (!user) {
      return;
    }

    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    setError(null);
    setMessage(null);
    setSaving(true);

    const input = {
      name: name.trim(),
      bike_type: bikeType,
      brand: brand.trim() || null,
      model: model.trim() || null,
      size: size.trim() || null,
      saddle_height_mm: parseOptionalNumber(saddleHeight),
      saddle_setback_mm: parseOptionalNumber(saddleSetback),
      stem_length_mm: parseOptionalNumber(stemLength),
      crank_length_mm: parseOptionalNumber(crankLength),
      handlebar_width_mm: parseOptionalNumber(handlebarWidth)
    };

    try {
      if (bikeId) {
        await updateBike(user.id, bikeId, input);
      } else {
        await createBike(user.id, input);
      }

      setMessage(t("bikeSaved"));
      router.replace("/bikes");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    if (!user || !bikeId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteBike(user.id, bikeId);
      router.replace("/bikes");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(t("deleteBike"), t("deleteBike"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: performDelete }
    ]);
  }

  return (
    <Screen maxWidth={820}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Heading>{bikeId ? t("editBike") : t("newBike")}</Heading>
          <Body>{t("bikeProfile")}</Body>
        </View>
        <Field label={t("authName")} onChangeText={setName} value={name} />
        <BikeTypeSelector onChange={setBikeType} value={bikeType} />
        <Inline>
          <View style={styles.splitField}>
            <Field label={t("brand")} onChangeText={setBrand} value={brand} />
          </View>
          <View style={styles.splitField}>
            <Field label={t("model")} onChangeText={setModel} value={model} />
          </View>
          <View style={styles.splitField}>
            <Field label={t("size")} onChangeText={setSize} value={size} />
          </View>
        </Inline>
        <Inline>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("saddleHeight")} onChangeText={setSaddleHeight} value={saddleHeight} />
          </View>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("saddleSetback")} onChangeText={setSaddleSetback} value={saddleSetback} />
          </View>
        </Inline>
        <Inline>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("stemLength")} onChangeText={setStemLength} value={stemLength} />
          </View>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("crankLength")} onChangeText={setCrankLength} value={crankLength} />
          </View>
          <View style={styles.splitField}>
            <Field inputMode="numeric" label={t("handlebarWidth")} onChangeText={setHandlebarWidth} value={handlebarWidth} />
          </View>
        </Inline>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Inline>
          <Button loading={saving} onPress={saveBike}>
            {t("save")}
          </Button>
          {bikeId ? (
            <LinkButton href={{ pathname: "/tire-pressure", params: { bikeId } }} variant="secondary">
              {t("tirePressureConfigure")}
            </LinkButton>
          ) : (
            <LinkButton href="/tire-pressure" variant="secondary">
              {t("tirePressureTitle")}
            </LinkButton>
          )}
          {bikeId ? (
            <Button loading={deleting} onPress={confirmDelete} variant="danger">
              {t("deleteBike")}
            </Button>
          ) : null}
        </Inline>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  splitField: {
    flexBasis: 210,
    flexGrow: 1
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  },
  message: {
    color: colors.primary,
    fontWeight: "800"
  }
});
