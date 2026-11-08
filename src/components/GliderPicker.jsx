import { Check } from "lucide-react";
import { GLIDERS } from "../sim/gliders";

export default function GliderPicker({ value, onChange }) {
  return (
    <section className="glider-picker glass" aria-labelledby="glider-picker-title">
      <div className="glider-picker-heading">
        <h2 id="glider-picker-title">Choose your glider</h2>
        <span>{GLIDERS[value].description}</span>
      </div>
      <div className="glider-options" role="radiogroup" aria-labelledby="glider-picker-title">
        {Object.values(GLIDERS).map((glider) => (
          <button
            key={glider.id}
            role="radio"
            aria-checked={value === glider.id}
            className={`glider-option ${value === glider.id ? "selected" : ""}`}
            onClick={(event) => {
              onChange(glider.id);
              event.currentTarget.blur();
            }}
          >
            <img src={glider.image} alt="" loading="eager" />
            <span className="glider-option-text">
              <strong>{glider.name}</strong>
              <span>{glider.role}</span>
              <small>
                {glider.span} m · glide {glider.glide}
              </small>
            </span>
            {value === glider.id && (
              <span className="glider-check">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
