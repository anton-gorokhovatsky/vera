# Фотографии, видео, шрифты и графика

Материалы отобраны 29–30.09.2026 из профиля Веры по разрешению Антона в задаче. На странице используются локальные файлы без запросов к Instagram. Ссылки на первоисточники сохранены в подписях и здесь.

| Файл | Источник | Содержание и обработка |
| --- | --- | --- |
| `site/assets/vera-serve.mp4` | [Ролик DakZAr7stdS](https://www.instagram.com/vera_dudenkova/reel/DakZAr7stdS/) | Подача Веры на крытом корте. Полный ролик 8,47 с; исходник 1440×2560, веб-копия H.264 720×1280, 569 739 байт. Звуковая дорожка удалена, перекодирование CRF 28, faststart. Временных склеек и изменения скорости нет |
| `site/assets/vera-serve.jpg` | Тот же ролик | Кадр на отметке 2,3 с, 1080×1920, 91 884 байта. Статичный первый экран при выключенном движении или недоступном видео |
| `site/assets/vera-portrait.jpg` | [Публикация DbLxLAtjErr](https://www.instagram.com/vera_dudenkova/p/DbLxLAtjErr/) | Первая фотография из карусели о пробежке; 1080×1440, 144 656 байт. Спортивный портрет в биографии, не кадр теннисной тренировки. JPEG-сжатие |
| `site/assets/court-morning.jpg` | [Актуальное «теннис»](https://www.instagram.com/stories/highlights/18025220059563084/), локальный `tennis-23.jpg` | Ракетка на корзине у сетки крытого корта. Уменьшение до 900×1600, JPEG, 213 609 байт |

Кадрирование выполняет CSS. Лица, тело, окружение и текст исходников не изменялись генерацией или ретушью. Для окончательного выбора фотографий можно получить исходники от Веры; текущие файлы — доступные версии Instagram.

Локальный архив из 23 материалов, источники и границы просмотра описаны в [INSTAGRAM.md](INSTAGRAM.md). Он находится в игнорируемом `.local/instagram-tennis/library/`, в Git и сборку не входит. Ранее выбранные статичный Rise и низкое разрешение обложки инвентаря сохранены в `.local/sources/previous-*`; в сайт входят только используемые ресурсы. Подписанные CDN-адреса не публикуются.

## Шрифты

Подключены локально 29.09.2026. Все три WOFF2 взяты без модификации из репозиториев авторов, с кириллицей. `font-display: swap`, системные fallback; внешних запросов к шрифтовым сервисам нет. Копии SIL Open Font License 1.1 лежат рядом с файлами.

| Файл | Источник | Роль |
| --- | --- | --- |
| `site/assets/fonts/commissioner-regular.woff2` | [Commissioner Regular](https://github.com/kosbarts/Commissioner/blob/master/fonts/webfonts/Commissioner-Regular.woff2) | Основной текст, подписи, заголовки второго уровня |
| `site/assets/fonts/commissioner-medium.woff2` | [Commissioner Medium](https://github.com/kosbarts/Commissioner/blob/master/fonts/webfonts/Commissioner-Medium.woff2) | Имя, кнопки и короткие метки |
| `site/assets/fonts/bona-nova-italic.woff2` | [Bona Nova Italic](https://github.com/kosmynkab/Bona-Nova/blob/main/fonts/webfonts/BonaNova-Italic.woff2) | Логотип `vera.`, «Увидимся на корте», личная фраза про Уимблдон, акцент контактного заголовка |

Шрифтовые файлы — 285 840 байт суммарно. [TypeDump](https://typedump.com/) использован для выбора; источники файлов — репозитории авторов.

## Графика Rise

Экспорт из [Playgrnd Rise](https://www.playgrnd.tools/rise) создан для сайта Веры 30.09.2026. Вариант `12124`, anchor `Centre`, stripes `22`, weight `58%`, bands `3`, depth `22%`, пропорции `16:9`, размер `2400×1350`. Цвета: field `#193e2d`, bars `#275039`, accent `#376047`. Grain и dither выключены. Анимация включена, intensity `0.45`, speed `8`, `72` frames: цикл 9 с.

- `site/assets/rise-loop.svg` — исходный экспорт SVG LOOP, 10 702 байта. Нативные SVG-анимации радиусов; сторонний runtime не нужен.
- `site/assets/rise-still.svg` — статичная версия того же рисунка без элементов `animate`, 10 120 байт.

Rise — декоративный CSS-фон верхнего поля корта, скрытый от скринридера. После перестройки сетки 30.09.2026 используется с opacity 0.26 (0.2 на телефоне), чтобы не спорить с разметкой корта. При паузе, reduced motion, экономии данных и без JavaScript используется статичный файл. Он не является фотографией корта или официальной графикой Wimbledon. Зависимости от сервиса Playgrnd на сайте нет.
