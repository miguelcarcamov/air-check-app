import { renderCards, renderSubtitle } from "./render-cards.js";
import { renderVerdicts } from "./render-verdicts.js";

export {
  relTime,
  setBanner,
  setBridgeStatus,
  setRefreshSpinning,
  syncBridgeInput,
  syncIndoorInput,
  toggleSettingsPanel,
} from "./dom.js";

export {
  clearLocationResults,
  renderLocationResults,
  renderLocationSettings,
  showLocationSearchMessage,
} from "./render-settings.js";

/** Full UI refresh from current {@link import('../state.js').state}. */
export function render() {
  const { outCat, inCat, outPmLevel, outO3Level, inLevel, outPm, inPm } = renderCards();
  renderVerdicts(outCat, outPmLevel, outO3Level, inCat, inLevel, inPm, outPm);
  renderSubtitle();
}
