import { useState } from 'react'

/**
 * LazyImage — Reusable component implementing image lazy loading
 * with smooth fade-in, skeleton loader, and fallback.
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  width,
  height,
  fallback = '/guns/pistol.svg',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const imageSrc = error ? fallback : src || fallback

  return (
    <div
      className={`lazy-img-container ${loaded ? 'is-loaded' : 'is-loading'}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
      }}
    >
      {!loaded && <div className="lazy-img-skeleton" aria-hidden="true" />}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} lazy-img-element ${loaded ? 'visible' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) {
            setError(true)
            setLoaded(true)
          }
        }}
        {...rest}
      />
    </div>
  )
}
