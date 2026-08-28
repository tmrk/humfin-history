import { useEffect, useMemo, useRef } from 'react';
import BgVideo from '../assets/bgvideo.mp4';
import Poster from '../assets/bgvideo.png';
import { adjustRowsForInflation } from '../lib/appeals';
import { lastYearInCPIdata } from '../lib/inflation';
import { formatCompact } from '../lib/format';
import RollingNumber from './RollingNumber';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const LoadingDots = () => (
  <span className="loading-dots" role="status">
    <span className="visually-hidden">Loading</span>
    <span aria-hidden="true">.</span>
    <span aria-hidden="true">.</span>
    <span aria-hidden="true">.</span>
  </span>
);

function Hero({ appeals, yearlyTotals }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    // Set both properties before play() so Chromium treats the decorative
    // video as inaudible even if attribute reflection is delayed.
    video.defaultMuted = true;
    video.muted = true;

    const playVideo = () => {
      const playAttempt = video.play();
      playAttempt?.catch(() => {
        // Edge can defer autoplay until the page receives an interaction.
        // The listeners below provide that retry without exposing controls
        // for a decorative video.
      });
    };

    const removeInteractionRetries = () => {
      window.removeEventListener('pointerdown', playVideo);
      window.removeEventListener('keydown', playVideo);
    };

    video.addEventListener('canplay', playVideo, { once: true });
    video.addEventListener('playing', removeInteractionRetries, { once: true });
    window.addEventListener('pointerdown', playVideo, { once: true });
    window.addEventListener('keydown', playVideo, { once: true });
    playVideo();

    return () => {
      video.removeEventListener('canplay', playVideo);
      video.removeEventListener('playing', removeInteractionRetries);
      removeInteractionRetries();
    };
  }, []);

  const stats = useMemo(() => {
    if (!appeals || !yearlyTotals.length) return null;
    const adjusted = adjustRowsForInflation(yearlyTotals);
    const peak = adjusted.reduce((max, row) =>
      row.amountFundedAndRequestedPre1994 > max.amountFundedAndRequestedPre1994 ? row : max
    );
    return {
      count: appeals.length,
      firstYear: yearlyTotals[0].year,
      lastYear: yearlyTotals[yearlyTotals.length - 1].year,
      peakYear: peak.year,
      peakValue: peak.amountFundedAndRequestedPre1994,
    };
  }, [appeals, yearlyTotals]);

  return (
    <header className="hero">
      {prefersReducedMotion ? (
        <div
          className="hero__video hero__video--still"
          style={{ backgroundImage: `url(${Poster})` }}
          aria-hidden="true"
        />
      ) : (
        <video
          ref={videoRef}
          className="hero__video"
          autoPlay
          playsInline
          loop
          muted
          preload="auto"
          poster={Poster}
          aria-hidden="true"
        >
          <source src={BgVideo} type="video/mp4" />
        </video>
      )}
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__content">
        <p className="hero__eyebrow">
          IFRC appeals · {stats ? `${stats.firstYear}–${stats.lastYear}` : 'since 1919'}
        </p>
        <h1>Humanitarian Finance History</h1>
        <div className="hero__rule" aria-hidden="true" />
        <p className="hero__dek">
          A century of emergency appeals by the world&rsquo;s largest humanitarian
          network: what was asked for, what was given, and the crises behind
          every spike.
        </p>
        <dl className="hero__stats">
          <div className="hero__stat">
            <dd>
              {stats ? <RollingNumber value={stats.count.toLocaleString('en-GB')} /> : <LoadingDots />}
            </dd>
            <dt>appeals recorded</dt>
          </div>
          <div className="hero__stat">
            <dd>
              {stats ? <RollingNumber value={stats.lastYear - stats.firstYear} /> : <LoadingDots />}
            </dd>
            <dt>years of records</dt>
          </div>
          <div className="hero__stat">
            <dd>
              {stats ? (
                <RollingNumber value={`${formatCompact(stats.peakValue)} CHF`} />
              ) : (
                <LoadingDots />
              )}
            </dd>
            <dt>
              {stats
                ? `asked in ${stats.peakYear}, the peak year (${lastYearInCPIdata} francs)`
                : 'peak year'}
            </dt>
          </div>
        </dl>
        <a className="hero__cue" href="#chart">
          Read the century ↓
        </a>
      </div>
    </header>
  );
}

export default Hero;
