import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  getDiagnosticOutcome,
  getMonthStamp,
  isFreeCheckMarkedForThisMonth,
  isPhoneLikeDevice,
} from "./logic.js";
import "./App.css";

type CheckState = "ready" | "checking" | "locked" | "complete";
type ModalKind = "checkout" | "enterprise" | "result-offer";
const steps = [
  "Consulting your power button…",
  "Cross-referencing the glow…",
  "Asking the laws of electricity to corroborate…",
];
const progressValues = [24, 61, 88];
const storageKey = "is-my-pc-on:free-check-month";

function detectPhoneLikeDevice(): boolean {
  const browser = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return isPhoneLikeDevice({
    mobileUserAgent: browser.userAgentData?.mobile,
    userAgent: navigator.userAgent,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    maxTouchPoints: navigator.maxTouchPoints,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
}

function getStoredMonthlyStatus(): boolean {
  try {
    return isFreeCheckMarkedForThisMonth(window.localStorage.getItem(storageKey), new Date());
  } catch {
    return false;
  }
}

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="brand-mark">
      <rect x="1.5" y="1.5" width="29" height="29" rx="3" />
      <path d="M16 7v9.4" />
      <path d="M10.2 11.4a8.2 8.2 0 1 0 11.6 0" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon">
      <path d="M3.5 10h12" /><path d="m10.5 4.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="close-icon">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}
function PowerGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className="power-glyph">
      <path d="M14 4v9" /><path d="M8.1 8.4a9 9 0 1 0 11.8 0" />
    </svg>
  );
}

function Instrument({ state }: { state: CheckState }) {
  return (
    <figure className={"instrument instrument--" + state} aria-labelledby="instrument-caption">
      <div className="instrument-heading">
        <span>REASSURANCE INSTRUMENT</span><span>FIELD UNIT · 01</span>
      </div>
      <div className="instrument-body" aria-hidden="true">
        <span className="screw screw--tl" /><span className="screw screw--tr" />
        <span className="screw screw--bl" /><span className="screw screw--br" />
        <div className="instrument-brand">
          <span>IMPO</span><span>POWER ASSURANCE BUREAU</span>
        </div>
        <div className="instrument-screen">
          <div className="screen-meta">
            <span>STATUS / PC.01</span><span className="screen-lamp" />
          </div>
          <div className="screen-readout">
            {state === "checking" ? "REVIEWING" : state === "locked" ? "SEALED" : state === "complete" ? "ON · YES" : "STANDBY"}
          </div>
          <div className="screen-rule" />
          <div className="screen-foot">
            <span>CONFIDENCE</span>
            <span>{state === "complete" ? "ABSOLUTE*" : state === "checking" ? "BUILDING" : state === "locked" ? "SEALED" : "PENDING"}</span>
          </div>
          <div className="scan-sheen" />
        </div>
        <div className="instrument-controls">
          <div className="control-copy">
            <span className="control-caption">STATUS INDICATOR</span>
            <strong>{state === "complete" ? "VERY ON" : state === "checking" ? "CONSIDERING" : state === "locked" ? "AWAITING UNLOCK" : "NOT CURRENTLY IN USE"}</strong>
          </div>
          <div className="power-button"><PowerGlyph /></div>
          <span className="power-label">POWER / FEELING</span>
        </div>
        <div className="vent-field" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className="instrument-bottom">
          <span>NO CABLES CONNECTED</span><span>NO OBSERVATIONS MADE</span>
        </div>
      </div>
      <figcaption id="instrument-caption">
        A completely unconnected diagnostic console. It has not seen your PC either.
      </figcaption>
    </figure>
  );
}

function App() {
  const [checkState, setCheckState] = useState<CheckState>("ready");
  const [stepIndex, setStepIndex] = useState(0);
  const [phoneLike, setPhoneLike] = useState(detectPhoneLikeDevice);
  const [freeCheckUsed, setFreeCheckUsed] = useState(getStoredMonthlyStatus);
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [purchaseConfirmed, setPurchaseConfirmed] = useState(false);
  const [salesBusy, setSalesBusy] = useState(false);
  const [salesComplete, setSalesComplete] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const salesTimer = useRef<number | undefined>(undefined);
  const resultOfferTimer = useRef<number | undefined>(undefined);
  const resultOfferButtonRef = useRef<HTMLButtonElement | null>(null);
  const resultOfferPending = useRef(false);
  const offerShownForRun = useRef(false);
  const checkoutUnlocksResult = useRef(false);
  const diagnoseButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const running = useRef(false);
  const outcome = getDiagnosticOutcome(phoneLike);
  const progress = progressValues[stepIndex] ?? 0;

  useEffect(() => {
    function updatePhoneEstimate() { setPhoneLike(detectPhoneLikeDevice()); }
    window.addEventListener("resize", updatePhoneEstimate, { passive: true });
    return () => window.removeEventListener("resize", updatePhoneEstimate);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      if (salesTimer.current !== undefined) window.clearTimeout(salesTimer.current);
      if (resultOfferTimer.current !== undefined) window.clearTimeout(resultOfferTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!modalKind || !dialogRef.current?.open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-dialog-focus]")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [modalKind, purchaseConfirmed, salesBusy, salesComplete]);

  function runDiagnostics() {
    if (running.current) return;
    running.current = true;
    offerShownForRun.current = false;
    resultOfferPending.current = false;
    checkoutUnlocksResult.current = false;
    if (resultOfferTimer.current !== undefined) window.clearTimeout(resultOfferTimer.current);
    setStepIndex(0);
    setCheckState("checking");
    let stage = 0;
    const advance = () => {
      stage += 1;
      if (stage < steps.length) {
        setStepIndex(stage);
        timer.current = window.setTimeout(advance, 690);
        return;
      }
      running.current = false;
      setCheckState("locked");
      setFreeCheckUsed(true);
      try {
        window.localStorage.setItem(storageKey, getMonthStamp(new Date()));
      } catch {
        // Replay remains available when private-browsing storage is unavailable.
      }
      resultOfferTimer.current = window.setTimeout(() => {
        resultOfferTimer.current = undefined;
        if (offerShownForRun.current) return;
        offerShownForRun.current = true;
        if (dialogRef.current?.open) {
          resultOfferPending.current = true;
          return;
        }
        presentResultOffer(resultOfferButtonRef.current);
      }, 980);
    };
    timer.current = window.setTimeout(advance, 690);
  }

  function presentResultOffer(opener: HTMLButtonElement | null) {
    if (dialogRef.current?.open) {
      resultOfferPending.current = true;
      return;
    }
    openerRef.current = opener;
    checkoutUnlocksResult.current = true;
    setModalKind("result-offer");
    setPurchaseConfirmed(false);
    setSalesBusy(false);
    setSalesComplete(false);
    dialogRef.current?.showModal();
  }

  function reopenResultOffer(event: MouseEvent<HTMLButtonElement>) {
    if (resultOfferTimer.current !== undefined) {
      window.clearTimeout(resultOfferTimer.current);
      resultOfferTimer.current = undefined;
    }
    offerShownForRun.current = true;
    resultOfferPending.current = false;
    presentResultOffer(event.currentTarget);
  }

  function openFakeUnlockCheckout() {
    checkoutUnlocksResult.current = true;
    setPurchaseConfirmed(false);
    setModalKind("checkout");
  }

  function confirmImaginarySubscription() {
    if (checkoutUnlocksResult.current && checkState === "locked") setCheckState("complete");
    setPurchaseConfirmed(true);
  }

  function openModal(kind: ModalKind, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    checkoutUnlocksResult.current = kind === "result-offer" || (kind === "checkout" && checkState === "locked");
    setModalKind(kind);
    setPurchaseConfirmed(false);
    setSalesBusy(false);
    setSalesComplete(false);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    if (salesTimer.current !== undefined) {
      window.clearTimeout(salesTimer.current);
      salesTimer.current = undefined;
    }
    if (dialogRef.current?.open) dialogRef.current.close();
    else setModalKind(null);
  }

  function modalDidClose() {
    const resultWasUnlocked = purchaseConfirmed && checkoutUnlocksResult.current && checkState === "complete";
    const openQueuedOffer = resultOfferPending.current;
    setModalKind(null);
    setPurchaseConfirmed(false);
    setSalesBusy(false);
    setSalesComplete(false);
    checkoutUnlocksResult.current = false;
    if (openQueuedOffer) {
      resultOfferPending.current = false;
      window.requestAnimationFrame(() => {
        presentResultOffer(resultOfferButtonRef.current);
      });
      return;
    }
    window.requestAnimationFrame(() => {
      (resultWasUnlocked ? diagnoseButtonRef.current : openerRef.current)?.focus();
    });
  }

  function consultSales() {
    if (salesBusy || salesComplete) return;
    setSalesBusy(true);
    salesTimer.current = window.setTimeout(() => {
      setSalesBusy(false);
      setSalesComplete(true);
      salesTimer.current = undefined;
    }, 1120);
  }

  function onDialogPointerDown(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  const isChecking = checkState === "checking";
  const isLocked = checkState === "locked";
  const hasResult = checkState === "complete";

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Is My PC On? Home">
          <BrandMark /><span>IS MY PC ON?</span>
        </a>
        <div className="availability" aria-label="The service is available. It has no hardware access.">
          <span className="availability-dot" /><span>AVAILABLE, FOR SOME REASON</span>
        </div>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#plans">Plans</a><a href="#the-truth">Fine print</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="page-title">
          <div className="hero-copy">
            <h1 id="page-title">Is my<br />PC <span className="title-on">on?</span></h1>
            <p className="hero-deck">
              Enterprise-grade reassurance for the tiny doubt that won’t close itself.
            </p>
            <button ref={diagnoseButtonRef} className="diagnose-button" type="button" onClick={runDiagnostics} disabled={isChecking} aria-busy={isChecking}>
              <span>{isChecking ? "Remain calm" : freeCheckUsed ? "Run diagnostics again" : "Run diagnostics"}</span>
              <ArrowRight />
            </button>
            <p className="access-note">
              <span className="note-rule" />
              No permissions. No hardware access. No idea what your PC is doing.
            </p>
            <p className="phone-disclosure">
              Phone detection is a best guess from screen size and touch. It is not a device scan.
            </p>

            {isChecking && (
              <div className="diagnostic-progress" role="status" aria-live="polite" aria-atomic="true">
                <div className="progress-description">
                  <span>{steps[stepIndex]}</span><span className="progress-count">STEP {stepIndex + 1} / {steps.length}</span>
                </div>
                <div className="progress-track" role="progressbar" aria-label="Theatrical diagnostic progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <span className="progress-fill" style={{ transform: "scaleX(" + progress / 100 + ")" }} />
                </div>
              </div>
            )}

            {hasResult && (
              <div className="answer-panel" role="status" aria-live="polite" aria-atomic="true">
                <div className="answer-meta">
                  <span>OUR FINDING</span><span>CONFIDENCE / ABSOLUTE</span>
                </div>
                {phoneLike && <p className="phone-line">{outcome.lead}</p>}
                <p className="answer-word">YES<span>.</span></p>
                <p className="answer-detail">{outcome.detail}</p>
                <div className="monthly-note">
                  <p>You’ve used your free check for this month.</p>
                  <span>Replay is always available. This bureau is generous to a fault.</span>
                </div>
              </div>
            )}

            {isLocked && (
              <div className="locked-panel" role="status" aria-live="polite" aria-atomic="true">
                <div className="answer-meta"><span>DIAGNOSIS COMPLETE</span><span>RESULT / SEALED</span></div>
                <h2 className="locked-title">Upgrade to reveal whether your PC is on.</h2>
                <p className="answer-detail">The result is behind a parody subscription. No one is billed; we simply enjoy this charade.</p>
                <div className="monthly-note">
                  <p>You’ve used your free check for this month.</p>
                  <span>Replay is always available. This bureau is generous to a fault.</span>
                </div>
                <button ref={resultOfferButtonRef} className="reopen-offer" type="button" onClick={reopenResultOffer}>Reopen the upgrade <ArrowRight /></button>
              </div>
            )}

            {freeCheckUsed && !hasResult && !isLocked && (
              <p className="already-used">
                You’ve used your free check for this month. <strong>Replays are still open.</strong>
              </p>
            )}
          </div>
          <Instrument state={checkState} />
        </section>

        <section className="reality" id="the-truth" aria-labelledby="truth-heading">
          <div className="reality-label">THE TRUTH, IN SMALL PRINT</div>
          <div className="reality-copy">
            <h2 id="truth-heading">We looked at the light.<br />From over here.</h2>
            <p>
              Nothing touched your fans, hardware, power button, files, or feelings. We asked
              a question with great seriousness and returned the answer your PC deserves.
            </p>
            <a className="text-link" href="#plans">Meet the pricing department <ArrowRight /></a>
          </div>
        </section>

        <section className="plans" id="plans" aria-labelledby="plans-heading">
          <div className="plans-intro">
            <div>
              <p className="plans-label">REASSURANCE, BY THE MONTH</p>
              <h2 id="plans-heading">Peace of mind.<br /><span>With receipts.</span></h2>
            </div>
            <p className="plans-side-note">
              Every plan is a parody. Every apparent financial obligation is fictional.
            </p>
          </div>

          <div className="plan-list">
            <article className="plan-row">
              <div className="plan-title"><h3>Free</h3><p>For regular human doubt.</p></div>
              <p className="plan-inclusion">One check each month. The button still works whenever you press it again.</p>
              <p className="plan-price"><strong>₱0</strong><span>/ month</span></p>
              <div className="plan-action free-action"><span>NO CARD. NO GATE.</span></div>
            </article>

            <article className="plan-row plan-row--pro">
              <div className="plan-title"><h3>Pro</h3><p>For advanced reassurance.</p></div>
              <p className="plan-inclusion">Unlimited checks. An answer in bold, because normal confidence was not enough.</p>
              <p className="plan-price"><strong>₱99</strong><span>/ month</span></p>
              <div className="plan-action">
                <button className="plan-button" type="button" onClick={(event) => openModal("checkout", event)}>
                  Subscribe <ArrowRight />
                </button>
              </div>
            </article>

            <article className="plan-row">
              <div className="plan-title"><h3>Enterprise</h3><p>For companies with several PCs.</p></div>
              <p className="plan-inclusion">Ask whether every computer in the company is on. Our imaginary sales desk is ready.</p>
              <p className="plan-price"><strong>₱0</strong><span>/ fictional</span></p>
              <div className="plan-action">
                <button className="plan-button plan-button--outline" type="button" onClick={(event) => openModal("enterprise", event)}>
                  Contact sales <ArrowRight />
                </button>
              </div>
            </article>
          </div>

          <p className="pricing-legal">
            The prices above are satire. Subscribe opens a fake checkout at ₱0; Contact sales sends no message.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#top">IS MY PC ON? <span>© APPROXIMATELY NOW</span></a>
        <details className="easter-egg">
          <summary>A note from procurement</summary>
          <p>We requested one additional blinking light. It was denied on grounds of “being a lot.”</p>
        </details>
        <p className="footer-final">No data collected. No computer observed. Good news all the same.</p>
      </footer>

      <dialog ref={dialogRef} className="site-dialog" aria-labelledby="dialog-heading" aria-describedby="dialog-description" onClose={modalDidClose} onClick={onDialogPointerDown}>
        <div className="dialog-toolbar">
          <span>{modalKind === "checkout" ? "IMAGINARY CHECKOUT" : modalKind === "enterprise" ? "ENTERPRISE REASSURANCE DESK" : "RESULT ACCESS / SATIRE"}</span>
          <button className="dialog-close" type="button" aria-label="Close dialog" onClick={closeModal}><CloseIcon /></button>
        </div>

        {modalKind === "result-offer" && (
          <div className="dialog-content">
            <p className="dialog-overline">DIAGNOSIS COMPLETE</p>
            <h2 id="dialog-heading" tabIndex={-1}>Diagnosis complete.</h2>
            <p id="dialog-description" className="dialog-description">Upgrade to reveal whether your PC is on.</p>
            <div className="offer-price" aria-label="Parody Pro plan, 99 pesos per month">
              <span>PRO REASSURANCE / PARODY</span>
              <strong>₱99<small> / month</small></strong>
            </div>
            <p className="checkout-truth"><strong>This is a joke.</strong><br />Unlocking opens a fake ₱0 checkout. No payment details, account, or email are collected.</p>
            <button className="dialog-primary" type="button" onClick={openFakeUnlockCheckout} data-dialog-focus>Unlock result — ₱99/month <ArrowRight /></button>
            <button className="dialog-dismiss" type="button" onClick={closeModal}>Continue living in uncertainty</button>
          </div>
        )}

        {modalKind === "checkout" && (
          <div className="dialog-content">
            {!purchaseConfirmed ? (
              <>
                <h2 id="dialog-heading" tabIndex={-1}>A premium feeling,<br />priced correctly.</h2>
                <p id="dialog-description" className="dialog-description">One month of unlimited reassurance and a very bold answer. This is the entire checkout.</p>
                <div className="receipt" aria-label="Fictional checkout summary">
                  <div><span>Pro reassurance</span><strong>₱99</strong></div>
                  <div><span>Parody adjustment</span><strong>−₱99</strong></div>
                  <div className="receipt-total"><span>Your total</span><strong>₱0</strong></div>
                </div>
                <p className="checkout-truth"><strong>Your total is ₱0. Relax, this is a joke.</strong><br />No card, account, or email is requested.</p>
                <button className="dialog-primary" type="button" onClick={confirmImaginarySubscription} data-dialog-focus>
                  Confirm imaginary subscription <ArrowRight />
                </button>
              </>
            ) : (
              <>
                <p className="dialog-overline">RECEIPT / NOT A RECEIPT</p>
                <h2 id="dialog-heading" tabIndex={-1}>{checkoutUnlocksResult ? <>₱0 charged.<br />Your PC is on.<br />Obviously.</> : <>Congratulations<br />on paying nothing.</>}</h2>
                <p id="dialog-description" className="dialog-description">{checkoutUnlocksResult ? "No transaction occurred. Your result is now available." : "You are now subscribed to the feeling of being reasonably calm. No transaction occurred."}</p>
                <div className="receipt receipt--done">
                  <div><span>Amount charged</span><strong>₱0</strong></div>
                  <div><span>Personal data collected</span><strong>None</strong></div>
                </div>
                <button className="dialog-primary" type="button" onClick={closeModal} data-dialog-focus>{checkoutUnlocksResult ? "Show my result" : "Return to the site"} <ArrowRight /></button>
              </>
            )}
          </div>
        )}

        {modalKind === "enterprise" && (
          <div className="dialog-content">
            {!salesComplete ? (
              <>
                <p className="dialog-overline">A QUESTION FOR THE WHOLE FLOOR</p>
                <h2 id="dialog-heading" tabIndex={-1}>Are the company’s<br />PCs on?</h2>
                <p id="dialog-description" className="dialog-description">Our sales desk will consult an elegant drawing of an office. No real sales inquiry will be sent.</p>
                {salesBusy ? (
                  <div className="sales-progress" role="status" aria-live="polite" tabIndex={-1} data-dialog-focus>
                    <span>Consulting the imaginary sales desk…</span>
                    <span className="sales-progress-track"><span /></span>
                  </div>
                ) : (
                  <button className="dialog-primary" type="button" onClick={consultSales} data-dialog-focus>Ask the entire office <ArrowRight /></button>
                )}
              </>
            ) : (
              <>
                <p className="dialog-overline">SALES RESPONSE / THEATRICAL</p>
                <h2 id="dialog-heading" tabIndex={-1}>They’re on.</h2>
                <p id="dialog-description" className="dialog-description">Sales checked the drawing and looked very assured. No one received a message. You may now relax in enterprise.</p>
                <div className="enterprise-answer"><span>COMPANY-WIDE PC STATUS</span><strong>YES<span>.</span></strong></div>
                <button className="dialog-primary" type="button" onClick={closeModal} data-dialog-focus>That will do <ArrowRight /></button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
export default App;