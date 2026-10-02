(() => {
  const repo = "ivan-s-2001/ShiftCalendar-Releases";
  const endpoint = `https://api.github.com/repos/${repo}/releases/latest`;

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  };

  const formatBytes = (bytes) => bytes > 0
    ? `${(bytes / 1048576).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} МБ`
    : "";

  async function loadRelease() {
    try {
      let title, url, size, published, notes;
      const local = await fetch("assets/latest-release.json", { cache: "no-store" });
      if (local.ok) {
        const data = await local.json();
        if (!/^\d+(?:\.\d+)*$/.test(data.versionName) ||
            !Number.isInteger(data.versionCode) ||
            !/^Grafik-SZ-[\w.-]+\.apk$/.test(data.apkAsset)) {
          throw new Error("Неверные данные релиза");
        }
        title = `График СЗ ${data.versionName} (${data.versionCode})`;
        url = `https://github.com/${repo}/releases/download/v${data.versionName}-${data.versionCode}/${data.apkAsset}`;
        size = data.size;
        notes = Array.isArray(data.notes) ? data.notes.slice(0, 8) : [];
      } else {
        const response = await fetch(endpoint, { headers: { Accept: "application/vnd.github+json" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const release = await response.json();
        const apk = release.assets?.find((asset) => asset.name?.endsWith(".apk"));
        if (!apk?.browser_download_url) throw new Error("APK отсутствует");
        title = release.name || release.tag_name || "Последняя версия";
        url = apk.browser_download_url;
        size = apk.size;
        const date = new Date(release.published_at);
        published = Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ru-RU", {
          day: "numeric", month: "long", year: "numeric",
        }).format(date);
        notes = String(release.body || "").split("\n")
          .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
          .filter((line) => line && !line.startsWith("#"))
          .slice(0, 8);
      }

      setText("[data-release-version]", title);
      setText("[data-release-meta]", [formatBytes(size), published].filter(Boolean).join(" · "));
      setText("[data-release-status]", "Подписанный APK загружается из GitHub Releases.");
      document.querySelectorAll("[data-download-latest]").forEach((link) => {
        link.href = url;
      });

      document.querySelectorAll("[data-release-notes]").forEach((list) => {
        list.replaceChildren(...(notes.length ? notes : ["Список изменений не указан."]).map((note) => {
          const item = document.createElement("li");
          item.textContent = note;
          return item;
        }));
      });
    } catch {
      setText("[data-release-version]", "Последняя версия");
      setText("[data-release-meta]", "Откройте страницу релизов");
      setText("[data-release-status]", "Не удалось проверить релиз. Кнопка откроет список выпусков на GitHub.");
      document.querySelectorAll("[data-release-notes]").forEach((list) => {
        const item = document.createElement("li");
        item.textContent = "Изменения доступны на странице релиза.";
        list.replaceChildren(item);
      });
    }
  }

  loadRelease();
})();
