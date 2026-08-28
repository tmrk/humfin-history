const DIGITS = Array.from({ length: 10 }, (_, index) => String(index));

function RollingDigit({ digit, index }) {
  const target = Number(digit);
  const turns = 2 + (index % 2);
  const steps = turns * DIGITS.length + target;
  const reel = Array.from({ length: steps + 1 }, (_, step) => DIGITS[step % DIGITS.length]);

  return (
    <span className="rolling-number__window">
      <span
        className="rolling-number__reel"
        style={{
          '--roll-delay': `${index * 55}ms`,
          '--roll-duration': `${900 + index * 90}ms`,
          '--roll-steps': steps,
        }}
      >
        {reel.map((value, step) => (
          <span className="rolling-number__digit" key={step}>
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingNumber({ value }) {
  const text = String(value);
  let digitIndex = -1;

  return (
    <span className="rolling-number" aria-label={text}>
      <span className="rolling-number__visual" aria-hidden="true">
        {[...text].map((character, index) => {
          if (/\d/.test(character)) {
            digitIndex += 1;
            return <RollingDigit digit={character} index={digitIndex} key={index} />;
          }
          return (
            <span className="rolling-number__character" key={index}>
              {character}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export default RollingNumber;
