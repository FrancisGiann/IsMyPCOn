import { useEffect, useRef, useState, type MouseEvent } from "react";
import { isPhoneLikeDevice } from "./logic.js";
import "./App.css";

type CheckState = "ready" | "checking" | "locked";
type ModalKind = "checkout" | "enterprise" | "result-offer";
const steps = [
  "Preparing the status check…",
  "Reviewing this page…",
  "Finalizing the check…",
];
const progressValues = [24, 61, 88];

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
            {state === "checking" ? "REVIEWING" : state === "locked" ? "LOCKED" : "STANDBY"}
          </div>
          <div className="screen-rule" />
          <div className="screen-foot">
            <span>CONFIDENCE</span>
            <span>{state === "checking" ? "IN PROGRESS" : state === "locked" ? "LOCKED" : "PENDING"}</span>
          </div>
          <div className="scan-sheen" />
        </div>
        <div className="instrument-controls">
          <div className="control-copy">
            <span className="control-caption">STATUS INDICATOR</span>
            <strong>{state === "checking" ? "IN PROGRESS" : state === "locked" ? "RESULT LOCKED" : "READY"}</strong>
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
        This display is not connected to your computer and cannot read its power state.
      </figcaption>
    </figure>
  );
}

function App() {
  const [checkState, setCheckState] = useState<CheckState>("ready");
  const [stepIndex, setStepIndex] = useState(0);
  const [phoneLike, setPhoneLike] = useState(detectPhoneLikeDevice);
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const resultOfferTimer = useRef<number | undefined>(undefined);
  const resultOfferButtonRef = useRef<HTMLButtonElement | null>(null);
  const resultOfferPending = useRef(false);
  const offerShownForRun = useRef(false);
  const diagnoseButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const running = useRef(false);
  const progress = progressValues[stepIndex] ?? 0;

  useEffect(() => {
    function updatePhoneEstimate() { setPhoneLike(detectPhoneLikeDevice()); }
    window.addEventListener("resize", updatePhoneEstimate, { passive: true });
    return () => window.removeEventListener("resize", updatePhoneEstimate);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      if (resultOfferTimer.current !== undefined) window.clearTimeout(resultOfferTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!modalKind || !dialogRef.current?.open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-dialog-focus]")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [modalKind]);

  function runDiagnostics() {
    if (running.current) return;
    running.current = true;
    offerShownForRun.current = false;
    resultOfferPending.current = false;
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
    setModalKind("result-offer");
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

  function openProDetails() {
    setModalKind("checkout");
  }

  function openModal(kind: ModalKind, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setModalKind(kind);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    if (dialogRef.current?.open) dialogRef.current.close();
    else setModalKind(null);
  }

  function modalDidClose() {
    const openQueuedOffer = resultOfferPending.current;
    setModalKind(null);
    if (openQueuedOffer) {
      resultOfferPending.current = false;
      window.requestAnimationFrame(() => {
        presentResultOffer(resultOfferButtonRef.current);
      });
      return;
    }
    window.requestAnimationFrame(() => {
      (openerRef.current ?? diagnoseButtonRef.current)?.focus();
    });
  }

  function onDialogPointerDown(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  const isChecking = checkState === "checking";
  const isLocked = checkState === "locked";

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Is My PC On? Home">
          <BrandMark /><span>IS MY PC ON?</span>
        </a>
        <div className="availability" aria-label="The service is available. It has no hardware access.">
          <span className="availability-dot" /><span>SERVICE ONLINE</span>
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
              A simple status check for the question: is your PC on?
            </p>
            <button ref={diagnoseButtonRef} className="diagnose-button" type="button" onClick={runDiagnostics} disabled={isChecking} aria-busy={isChecking}>
              <span>{isChecking ? "Checking…" : isLocked ? "Run diagnostics again" : "Run diagnostics"}</span>
              <ArrowRight />
            </button>
            <p className="access-note">
              <span className="note-rule" />
              This page has no hardware access and cannot read your PC’s power state.
            </p>
            {phoneLike && <p className="phone-disclosure">Mobile display is estimated from browser and screen details. No computer data is accessed.</p>}

            {isChecking && (
              <div className="diagnostic-progress" role="status" aria-live="polite" aria-atomic="true">
                <div className="progress-description">
                  <span>{steps[stepIndex]}</span><span className="progress-count">STEP {stepIndex + 1} / {steps.length}</span>
                </div>
                <div className="progress-track" role="progressbar" aria-label="Diagnostic progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <span className="progress-fill" style={{ transform: "scaleX(" + progress / 100 + ")" }} />
                </div>
              </div>
            )}

            {isLocked && (
              <div className="locked-panel" role="status" aria-live="polite" aria-atomic="true">
                <div className="answer-meta"><span>CHECK COMPLETE</span><span>RESULT / LOCKED</span></div>
                <h2 className="locked-title">Your result is currently locked.</h2>
                <p className="answer-detail">Pro is ₱99/month. Online checkout is not available yet, so this result cannot be unlocked.</p>
                <button ref={resultOfferButtonRef} className="reopen-offer" type="button" onClick={reopenResultOffer}>View Pro plan <ArrowRight /></button>
              </div>
            )}
          </div>
          <Instrument state={checkState} />
        </section>

        <section className="reality" id="the-truth" aria-labelledby="truth-heading">
          <div className="reality-label">ABOUT THIS CHECK</div>
          <div className="reality-copy">
            <h2 id="truth-heading">Your PC’s status<br />stays private.</h2>
            <p>
              This page does not connect to your computer or inspect its hardware, files, or
              power button. It cannot determine whether your PC is on.
            </p>
            <a className="text-link" href="#plans">View plans <ArrowRight /></a>
          </div>
        </section>

        <section className="plans" id="plans" aria-labelledby="plans-heading">
          <div className="plans-intro">
            <div>
              <p className="plans-label">SUBSCRIPTION PLANS</p>
              <h2 id="plans-heading">Choose a plan.<br /><span>Get started.</span></h2>
            </div>
            <p className="plans-side-note">
              Pro is ₱99 per month. Enterprise pricing is custom.
            </p>
          </div>

          <div className="plan-list">
            <article className="plan-row plan-row--pro">
              <div className="plan-title"><h3>Pro</h3><p>For advanced reassurance.</p></div>
              <p className="plan-inclusion">Unlimited checks and access to diagnostic results.</p>
              <p className="plan-price"><strong>₱99</strong><span>/ month</span></p>
              <div className="plan-action">
                <button className="plan-button" type="button" onClick={(event) => openModal("checkout", event)}>
                  Subscribe <ArrowRight />
                </button>
              </div>
            </article>

            <article className="plan-row">
              <div className="plan-title"><h3>Enterprise</h3><p>For companies with several PCs.</p></div>
              <p className="plan-inclusion">Custom plans and pricing for teams.</p>
              <p className="plan-price"><strong>Custom</strong><span>pricing</span></p>
              <div className="plan-action">
                <button className="plan-button plan-button--outline" type="button" onClick={(event) => openModal("enterprise", event)}>
                  Contact sales <ArrowRight />
                </button>
              </div>
            </article>
          </div>

          <p className="pricing-legal">
            Online checkout and sales contact are not available yet. This page cannot access your computer.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#top">IS MY PC ON? <span>© 2026</span></a>
        <details className="easter-egg">
          <summary>About this website</summary>
          <p>This website does not collect diagnostic or payment information.</p>
        </details>
        <p className="footer-final">No computer connection. No device data collected.</p>
      </footer>

      <dialog ref={dialogRef} className="site-dialog" aria-labelledby="dialog-heading" aria-describedby="dialog-description" onClose={modalDidClose} onClick={onDialogPointerDown}>
        <div className="dialog-toolbar">
          <span>{modalKind === "checkout" ? "PRO SUBSCRIPTION" : modalKind === "enterprise" ? "ENTERPRISE PLAN" : "PRO PLAN"}</span>
          <button className="dialog-close" type="button" aria-label="Close dialog" onClick={closeModal}><CloseIcon /></button>
        </div>

        {modalKind === "result-offer" && (
          <div className="dialog-content">
            <p className="dialog-overline">RESULT / LOCKED</p>
            <h2 id="dialog-heading" tabIndex={-1}>View the Pro plan.</h2>
            <p id="dialog-description" className="dialog-description">Pro costs ₱99 per month and includes access to diagnostic results.</p>
            <div className="offer-price" aria-label="Pro plan, 99 pesos per month">
              <span>PRO / MONTHLY</span>
              <strong>₱99<small> / month</small></strong>
            </div>
            <p id="dialog-availability" className="checkout-truth">Online checkout is not available yet. This result cannot be unlocked.</p>
            <button className="dialog-primary" type="button" onClick={openProDetails} data-dialog-focus>Subscription details <ArrowRight /></button>
          </div>
        )}

        {modalKind === "checkout" && (
          <div className="dialog-content">
            <p className="dialog-overline">₱99 / MONTH</p>
            <h2 id="dialog-heading" tabIndex={-1}>Pro subscription.</h2>
            <p id="dialog-description" className="dialog-description">Pro includes unlimited checks and access to diagnostic results.</p>
            <div className="offer-price" aria-label="Pro plan, 99 pesos per month">
              <span>MONTHLY PRICE</span>
              <strong>₱99<small> / month</small></strong>
            </div>
            <p className="checkout-truth">Online checkout is not available yet. No payment has been made and no subscription has been created.</p>
            <button className="dialog-primary" type="button" onClick={closeModal} data-dialog-focus>Close <ArrowRight /></button>
          </div>
        )}

        {modalKind === "enterprise" && (
          <div className="dialog-content">
            <p className="dialog-overline">CUSTOM PRICING</p>
            <h2 id="dialog-heading" tabIndex={-1}>Enterprise plan.</h2>
            <p id="dialog-description" className="dialog-description">Enterprise pricing is custom. Sales contact is not available yet.</p>
            <button className="dialog-primary" type="button" onClick={closeModal} data-dialog-focus>Close <ArrowRight /></button>
          </div>
        )}
      </dialog>
    </>
  );
}
export default App;
