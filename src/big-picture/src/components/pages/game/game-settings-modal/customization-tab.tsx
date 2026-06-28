import type { ChangeEvent } from "react";
import type { LibraryGame } from "@types";
import { PencilIcon, SearchIcon } from "@primer/octicons-react";
import { Trash } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  FocusItem,
  GridFocusGroup,
  Input,
  Modal,
  Tabs,
  type TabsItem,
  VerticalFocusGroup,
} from "../../../common";
import { resolvePreferredGameAssets } from "../../../../helpers";
import { SettingsSection } from "../../../../pages/settings/settings-section";
import { useBigPictureToast } from "../../../../hooks";

import "./customization-tab.scss";

export const GAME_CUSTOMIZATION_SETTINGS_PRIMARY_CONTROL_ID =
  "game-customization-settings-primary-control";
const GAME_CUSTOMIZATION_SETTINGS_ASSET_PREVIEW_ID =
  "game-customization-settings-asset-preview";
const SGDB_SEARCH_INPUT_ID = "sgdb-search-input";
const SGDB_SEARCH_BTN_ID = "sgdb-search-btn";

type AssetTab = "icon" | "logo" | "hero";
type AssetPreviewState = Record<AssetTab, { src: string; hasCustom: boolean }>;

const ASSET_FRAME_SIZES: Record<AssetTab, { width: number; height: number }> = {
  icon: { width: 192, height: 192 },
  logo: { width: 341.33, height: 192 },
  hero: { width: 594.58, height: 192 },
};

export interface GameCustomizationSettingsProps {
  game: LibraryGame;
  gameTitle: string;
  updatingGameTitle: boolean;
  onChangeGameTitle: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlurGameTitle: () => Promise<void>;
  onSelectAsset: (assetType: AssetTab) => Promise<void>;
  onSelectAssetFromSgdb: (assetType: AssetTab, url: string) => Promise<void>;
  onClearAsset: (assetType: AssetTab) => Promise<void>;
}

function getAssetPreviewState(game: LibraryGame): AssetPreviewState {
  const preferredAssets = resolvePreferredGameAssets(game, null);
  const isCustom = game.shop === "custom";
  return {
    icon: {
      src: preferredAssets.iconSrc,
      hasCustom: isCustom ? Boolean(game.iconUrl) : Boolean(game.customIconUrl),
    },
    logo: {
      src: preferredAssets.logoSrc,
      hasCustom: isCustom ? Boolean(game.logoImageUrl) : Boolean(game.customLogoImageUrl),
    },
    hero: {
      src: preferredAssets.heroSrc,
      hasCustom: isCustom ? Boolean(game.libraryHeroImageUrl) : Boolean(game.customHeroImageUrl),
    },
  };
}

function getFallbackPreviewState(game: LibraryGame, assetType: AssetTab): AssetPreviewState[AssetTab] {
  const isCustom = game.shop === "custom";
  const keyMap: Record<AssetTab, string> = {
    icon: isCustom ? "iconUrl" : "customIconUrl",
    logo: isCustom ? "logoImageUrl" : "customLogoImageUrl",
    hero: isCustom ? "libraryHeroImageUrl" : "customHeroImageUrl",
  };
  const nextGame = { ...game, [keyMap[assetType]]: null };
  const assets = resolvePreferredGameAssets(nextGame, null);
  return {
    src: assetType === "icon" ? assets.iconSrc : assetType === "logo" ? assets.logoSrc : assets.heroSrc,
    hasCustom: false,
  };
}

interface SgdbPickerModalProps {
  visible: boolean;
  game: LibraryGame;
  assetType: AssetTab;
  onClose: () => void;
  onSelect: (url: string) => Promise<void>;
}

function SgdbPickerModal({ visible, game, assetType, onClose, onSelect }: Readonly<SgdbPickerModalProps>) {
  const { t } = useTranslation("big_picture");
  const { showErrorToast } = useBigPictureToast();
  const [query, setQuery] = useState(game.title);
  const [results, setResults] = useState<{ id: number; url: string; thumb: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);
  const hasSearched = useRef(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const steamAppId = game.shop === "steam" ? game.objectId : null;
      const res = await globalThis.window.electron.searchSteamGridDb(q.trim(), assetType, steamAppId);
      setResults(res);
      if (res.length === 0) {
        showErrorToast(t("sgdb_no_results"), { fallbackVisual: "settings" });
      }
    } catch {
      showErrorToast(t("sgdb_no_results"), { fallbackVisual: "settings" });
    } finally {
      setLoading(false);
    }
  }, [assetType, game, showErrorToast, t]);

  useEffect(() => {
    if (visible && !hasSearched.current) {
      hasSearched.current = true;
      setQuery(game.title);
      void doSearch(game.title);
    }
    if (!visible) {
      hasSearched.current = false;
      setResults([]);
    }
  }, [visible, doSearch, game.title]);

  const handleSelect = useCallback(async (item: { id: number; url: string; thumb: string }) => {
    setApplying(item.id);
    try {
      await onSelect(item.url);
      onClose();
    } catch {
      showErrorToast(t("sgdb_no_results"), { fallbackVisual: "settings" });
    } finally {
      setApplying(null);
    }
  }, [onClose, onSelect, showErrorToast, t]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("sgdb_picker_title")}
      description={t("sgdb_picker_description")}
      initialFocusId={SGDB_SEARCH_INPUT_ID}
      closeOnB
      closeOnEscape
    >
      <div className="sgdb-picker">
        <div className="sgdb-picker__search-row">
          <Input
            id="sgdb-search"
            className="sgdb-picker__search-input"
            placeholder={t("sgdb_search_placeholder")}
            value={query}
            focusId={SGDB_SEARCH_INPUT_ID}
            focusNavigationOverrides={{
              right: { type: "item", itemId: SGDB_SEARCH_BTN_ID },
              down: results.length ? { type: "item", itemId: `sgdb-item-0` } : { type: "block" },
            }}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void doSearch(query);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            loading={loading}
            focusId={SGDB_SEARCH_BTN_ID}
            focusNavigationOverrides={{
              left: { type: "item", itemId: SGDB_SEARCH_INPUT_ID },
              down: results.length ? { type: "item", itemId: `sgdb-item-0` } : { type: "block" },
            }}
            icon={<SearchIcon size={16} />}
            onClick={() => void doSearch(query)}
          >
            {t("sgdb_search_button")}
          </Button>
        </div>

        {loading && (
          <p className="sgdb-picker__status">{t("sgdb_loading")}</p>
        )}

        {!loading && results.length > 0 && (
          <GridFocusGroup className="sgdb-picker__grid">
            {results.map((item, index) => (
              <FocusItem
                key={item.id}
                id={`sgdb-item-${index}`}
                asChild
                actions={{ primary: () => void handleSelect(item) }}
              >
                <button
                  type="button"
                  className="sgdb-picker__item"
                  onClick={() => void handleSelect(item)}
                  disabled={applying !== null}
                  aria-busy={applying === item.id}
                >
                  {applying === item.id && (
                    <div className="sgdb-picker__item-overlay" aria-hidden />
                  )}
                  <img
                    src={item.thumb}
                    alt=""
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              </FocusItem>
            ))}
          </GridFocusGroup>
        )}

        {!loading && results.length === 0 && hasSearched.current && (
          <p className="sgdb-picker__status">{t("sgdb_no_results")}</p>
        )}
      </div>
    </Modal>
  );
}

export function GameCustomizationSettingsTab({
  game,
  gameTitle,
  updatingGameTitle,
  onChangeGameTitle,
  onBlurGameTitle,
  onSelectAsset,
  onSelectAssetFromSgdb,
  onClearAsset,
}: Readonly<GameCustomizationSettingsProps>) {
  const { t } = useTranslation("big_picture");
  const [selectedAssetTab, setSelectedAssetTab] = useState<AssetTab>("icon");
  const [hasAssetTabsInteracted, setHasAssetTabsInteracted] = useState(false);
  const [assetPreviewState, setAssetPreviewState] = useState<AssetPreviewState>(
    () => getAssetPreviewState(game)
  );
  const [pendingAssetTab, setPendingAssetTab] = useState<AssetTab | null>(null);
  const [sgdbPickerOpen, setSgdbPickerOpen] = useState(false);

  const assetTabItems = useMemo(
    () =>
      [
        { value: "icon", label: t("edit_game_modal_icon") },
        { value: "logo", label: t("edit_game_modal_logo") },
        { value: "hero", label: t("edit_game_modal_hero") },
      ] satisfies Array<TabsItem<AssetTab>>,
    [t]
  );

  const handleAssetTabChange = useCallback((value: AssetTab) => {
    setSelectedAssetTab(value);
    setHasAssetTabsInteracted(true);
  }, []);

  const assetFrameSize = ASSET_FRAME_SIZES[selectedAssetTab];
  const hasCustomAsset = assetPreviewState[selectedAssetTab].hasCustom;
  const assetImageSource = assetPreviewState[selectedAssetTab].src;

  const handleAssetPreviewAction = useCallback(() => {
    if (pendingAssetTab) return;
    if (hasCustomAsset) {
      setPendingAssetTab(selectedAssetTab);
      setAssetPreviewState((cur) => ({
        ...cur,
        [selectedAssetTab]: getFallbackPreviewState(game, selectedAssetTab),
      }));
      void onClearAsset(selectedAssetTab).finally(() => {
        setPendingAssetTab((cur) => (cur === selectedAssetTab ? null : cur));
      });
      return;
    }
    setPendingAssetTab(selectedAssetTab);
    void onSelectAsset(selectedAssetTab).finally(() => {
      setPendingAssetTab((cur) => (cur === selectedAssetTab ? null : cur));
    });
  }, [game, hasCustomAsset, onClearAsset, onSelectAsset, pendingAssetTab, selectedAssetTab]);

  useEffect(() => {
    setAssetPreviewState(getAssetPreviewState(game));
    setPendingAssetTab(null);
  }, [game]);

  const handleSgdbSelect = useCallback(async (url: string) => {
    await onSelectAssetFromSgdb(selectedAssetTab, url);
  }, [onSelectAssetFromSgdb, selectedAssetTab]);

  return (
    <VerticalFocusGroup className="game-customization-settings-tab">
      <SettingsSection
        className="game-customization-settings-tab__section"
        title={t("edit_game_modal_section_title")}
        description={t("edit_game_modal_section_title_description")}
      >
        <div className="game-customization-settings-tab__section-content">
          <Input
            focusId={GAME_CUSTOMIZATION_SETTINGS_PRIMARY_CONTROL_ID}
            placeholder={t("edit_game_modal_enter_title")}
            value={gameTitle}
            disabled={updatingGameTitle}
            onChange={onChangeGameTitle}
            onBlur={() => { void onBlurGameTitle(); }}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        className="game-customization-settings-tab__section game-customization-settings-tab__section--assets"
        title={t("edit_game_modal_assets")}
        description={t("edit_game_modal_section_assets_description")}
      >
        <div className="game-customization-settings-tab__section-content game-customization-settings-tab__section-content--assets">
          <Tabs
            items={assetTabItems}
            value={selectedAssetTab}
            defaultValue="icon"
            onValueChange={handleAssetTabChange}
            itemsFocusable={false}
            animateSegmentedIndicator={hasAssetTabsInteracted}
            variant="segmented"
            ariaLabel={t("edit_game_modal_assets")}
            className="game-customization-settings-tab__asset-tabs"
          />

          <div className="game-customization-settings-tab__asset-preview">
            <FocusItem
              id={GAME_CUSTOMIZATION_SETTINGS_ASSET_PREVIEW_ID}
              asChild
              actions={{ primary: handleAssetPreviewAction }}
            >
              <button
                type="button"
                className="game-customization-settings-tab__asset-preview-frame"
                onClick={handleAssetPreviewAction}
                style={{ width: assetFrameSize.width, height: assetFrameSize.height }}
                aria-label={hasCustomAsset ? t("edit_game_modal_remove_asset") : t("edit_game_modal_assets")}
              >
                {assetImageSource ? (
                  <img
                    className="game-customization-settings-tab__asset-preview-image"
                    src={assetImageSource}
                    alt={gameTitle}
                    draggable={false}
                  />
                ) : null}
                <span
                  className={`game-customization-settings-tab__asset-preview-overlay${hasCustomAsset ? " game-customization-settings-tab__asset-preview-overlay--danger" : ""}`}
                  aria-hidden="true"
                >
                  <span className={`game-customization-settings-tab__asset-preview-overlay-icon${hasCustomAsset ? " game-customization-settings-tab__asset-preview-overlay-icon--danger" : ""}`}>
                    {hasCustomAsset ? <Trash size={20} /> : <PencilIcon size={22} />}
                  </span>
                </span>
              </button>
            </FocusItem>
          </div>

          <FocusItem
            id="sgdb-open-btn"
            asChild
            actions={{ primary: () => setSgdbPickerOpen(true) }}
          >
            <button
              type="button"
              className="game-customization-settings-tab__sgdb-btn"
              onClick={() => setSgdbPickerOpen(true)}
              disabled={Boolean(pendingAssetTab)}
            >
              <SearchIcon size={14} />
              {t("sgdb_browse_button")}
            </button>
          </FocusItem>
        </div>
      </SettingsSection>

      <SgdbPickerModal
        visible={sgdbPickerOpen}
        game={game}
        assetType={selectedAssetTab}
        onClose={() => setSgdbPickerOpen(false)}
        onSelect={handleSgdbSelect}
      />
    </VerticalFocusGroup>
  );
}
