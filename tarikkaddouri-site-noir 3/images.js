// The roll. Films play one after another; plays: 2 = loop once before moving on.
// Phone overrides: mvideo / mposter (alternate cut), mpos: "x% y%" (where to frame on a phone).
window.ROLL = [
  { video: "media/stage-talk.mp4", poster: "media/stage-talk.jpg", place: "Pure Performance, Porsche Studio", year: "2024" },
  { video: "media/news.mp4", poster: "media/news.jpg", mvideo: "media/news-close.mp4", mposter: "media/news-close.jpg", place: "KOIN 6, Portland", year: "2023" },
  { video: "media/lq-film.mp4", poster: "media/lq-film-poster.jpg", place: "Porsche Studio, Portland", year: "2024" },
  { plays: 2, video: "media/columbia-cave.mp4", poster: "media/columbia-cave.jpg", mvideo: "media/columbia-cave-m.mp4", mposter: "media/columbia-cave-m.jpg", place: "Oregon Coast · Columbia", year: "2024" },
  { plays: 2, video: "media/columbia-coast.mp4", poster: "media/columbia-coast.jpg", mpos: "44% 50%", place: "Oregon Coast · Columbia", year: "2025" },
  { plays: 2, video: "media/oregon-lottery.mp4", poster: "media/oregon-lottery.jpg", mvideo: "media/oregon-lottery-m.mp4", mposter: "media/oregon-lottery-m.jpg", place: "Oregon Lottery · Little Gift, Big Cheer", year: "2025" }
];
