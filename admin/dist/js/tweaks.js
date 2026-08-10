(function() {
  const { useState, useEffect } = React;
  const THEMES = ["navy", "dark", "light"];
  const DENSITY = ["compact", "comfortable"];
  function TweaksPanel() {
    const defaults = window.__tweakDefaults || {};
    const [side, setSide] = useState(defaults.sideTheme || "navy");
    const [density, setDensity] = useState(defaults.density || "compact");
    const [width, setWidth] = useState(defaults.sideWidth || 248);
    const apply = (s, d, w) => {
      const shell = document.querySelector(".shell");
      if (!shell) return;
      shell.dataset.side = s;
      shell.dataset.density = d;
      shell.style.setProperty("--side-w", w + "px");
    };
    useEffect(() => apply(side, density, width), []);
    const changeSide = (v) => {
      setSide(v);
      apply(v, density, width);
    };
    const changeDens = (v) => {
      setDensity(v);
      apply(side, v, width);
    };
    const changeWidth = (v) => {
      setWidth(v);
      apply(side, density, v);
    };
    return /* @__PURE__ */ React.createElement("div", { style: {
      position: "fixed",
      bottom: 20,
      right: 20,
      zIndex: 9999,
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: 14,
      boxShadow: "var(--shadow-pop)",
      padding: "16px 18px",
      width: 220,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      fontSize: 12
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", color: "var(--text-2)", textTransform: "uppercase" } }, "Tasar\u0131m Tweaks"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, "Kenar \xE7ubu\u011Fu temas\u0131"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, THEMES.map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t,
        onClick: () => changeSide(t),
        style: {
          flex: 1,
          padding: "5px 4px",
          borderRadius: 6,
          border: "1px solid",
          borderColor: side === t ? "var(--brand-navy)" : "var(--border)",
          background: side === t ? "var(--brand-navy-soft)" : "transparent",
          color: side === t ? "var(--brand-navy)" : "var(--text-2)",
          fontWeight: side === t ? 700 : 500,
          fontSize: 11,
          cursor: "pointer"
        }
      },
      t
    )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, "Yo\u011Funluk"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, DENSITY.map((d) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: d,
        onClick: () => changeDens(d),
        style: {
          flex: 1,
          padding: "5px 4px",
          borderRadius: 6,
          border: "1px solid",
          borderColor: density === d ? "var(--brand-navy)" : "var(--border)",
          background: density === d ? "var(--brand-navy-soft)" : "transparent",
          color: density === d ? "var(--brand-navy)" : "var(--text-2)",
          fontWeight: density === d ? 700 : 500,
          fontSize: 11,
          cursor: "pointer"
        }
      },
      d === "compact" ? "S\u0131k\u0131\u015F\u0131k" : "Geni\u015F"
    )))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-2)" } }, "Kenar \xE7ubu\u011Fu geni\u015Fli\u011Fi: ", width, "px"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "200",
        max: "320",
        value: width,
        onChange: (e) => changeWidth(Number(e.target.value)),
        style: { width: "100%" }
      }
    )));
  }
  const host = document.querySelector(".tweaks-host");
  if (host) {
    const root = ReactDOM.createRoot(host);
    let visible = false;
    const toggle = () => {
      visible = !visible;
      document.body.dataset.edit = visible ? "1" : "0";
      if (visible) root.render(/* @__PURE__ */ React.createElement(TweaksPanel, null));
    };
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "T") toggle();
    });
  }
})();
