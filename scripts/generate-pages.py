#!/usr/bin/env python3
"""Generate collection detail and product detail pages."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

BRAND_HEAD = """  <link rel="icon" href="/assets/favicon.png" type="image/png" sizes="512x512">
  <link rel="shortcut icon" href="/assets/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/favicon.png" sizes="512x512">
  <meta property="og:site_name" content="APC Containers">
  <meta property="og:image" content="/assets/favicon.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:image" content="/assets/favicon.png">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "APC Containers",
    "url": "/",
    "logo": "/assets/favicon.png"
  }
  </script>"""

REVEAL_TAG_PATTERN = re.compile(
    r"<(?P<tag>h1|h2|p)\b(?P<attrs>[^>]*\bdata-reveal-words[^>]*)>(?P<body>.*?)</(?P=tag)>",
    re.DOTALL | re.IGNORECASE,
)


def split_reveal_words(content: str) -> str:
    if "reveal-word" in content:
        return content.strip()
    if re.search(r"<[a-zA-Z]", content):
        return content.strip()

    def replacer(match: re.Match[str]) -> str:
        text = match.group(0)
        parts = re.split(r"(\s+)", text)
        out: list[str] = []
        for part in parts:
            if not part:
                continue
            if re.match(r"^\s+$", part):
                out.append(part)
            else:
                out.append(f'<span class="reveal-word">{part}</span>')
        return "".join(out)

    return re.sub(r"[^<]+", replacer, content.strip())


PRODUCTS = {
    "tropical-paradise-plant": {
        "name": "Tropical Paradise Plant",
        "price": "39.99",
        "compare": None,
        "collection": "home",
        "image": "tElJe5z6jmy6md1MRCKy40PRUc.png",
        "description": "The Tropical Paradise Plant adds a touch of the exotic to any space. Its lush, deep-green leaves provide a calming and refreshing aesthetic, perfect for brightening up your home or workspace. Low-maintenance and versatile, this plant is ideal for both seasoned and beginner plant enthusiasts.",
        "variant_label": "Pot Color",
        "variants": ["Black", "White", "Gray"],
        "section1_title": "Bring the tropics into your space",
        "section1_text": "The Tropical Paradise Plant adds a vibrant, lush aesthetic to any room. Its bold, green foliage creates a calming and natural atmosphere, making it a perfect addition to your home or office.",
        "section2_title": "Low-maintenance and versatile",
        "section2_text": "Designed for all plant enthusiasts, this tropical plant is easy to care for and thrives in a variety of indoor settings. Whether you're a seasoned plant parent or a beginner, it's a hassle-free way to enhance your space.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "classic-off-white-trainers"],
    },
    "potted-succulent-plant": {
        "name": "Potted Succulent Plant",
        "price": "24.99",
        "compare": None,
        "collection": "home",
        "image": "jSqxgKoxQZr1zZomzhjmmO2ew.png",
        "description": "The Potted Succulent Plant is an ideal choice for adding a touch of nature to your home or workspace. With its vibrant green leaves and a sleek, modern pot, this succulent requires minimal care, making it perfect for busy individuals or first-time plant owners.",
        "variant_label": "Pot Color",
        "variants": ["Black", "White", "Gray"],
        "section1_title": "Effortless greenery for any space",
        "section1_text": "The Potted Succulent Plant brings a fresh, natural touch to your home or office. Its compact design makes it the perfect addition to shelves, desks, or tables, instantly elevating your space with minimal effort.",
        "section2_title": "Low-maintenance and long-lasting",
        "section2_text": "Designed for busy lifestyles, this succulent thrives with minimal care. Its durable and resilient nature ensures it stays vibrant and beautiful, making it ideal for first-time plant owners and experienced enthusiasts alike.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "tropical-paradise-plant"],
    },
    "modern-lounge-armchair": {
        "name": "Modern Lounge Armchair",
        "price": "299.99",
        "compare": "349.99",
        "collection": "home",
        "image": "wQCYenRpKmc9i0iVibBrrmx47s.png",
        "description": "The Modern Lounge Armchair combines contemporary style with ultimate comfort. Its soft upholstery, supportive cushioning, and clean lines make it a perfect addition to living rooms, offices, or reading nooks. Crafted with durable materials, it's designed for both relaxation and long-lasting quality.",
        "variant_label": "Upholstery material",
        "variants": ["Leather", "Velvet", "Suede"],
        "section1_title": "Elevate your space with modern style",
        "section1_text": "The Modern Lounge Armchair combines sleek design with timeless elegance. Its clean lines and contemporary shape make it the perfect statement piece for living rooms, offices, or cozy reading nooks.",
        "section2_title": "Unmatched comfort for relaxation",
        "section2_text": "Crafted with soft upholstery and supportive cushioning, this armchair provides ultimate comfort. Whether you're unwinding after a long day or diving into a good book, it's designed for relaxation that lasts.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "tropical-paradise-plant"],
    },
    "horizon-glow-sneakers": {
        "name": "Horizon Glow Sneakers",
        "price": "129.99",
        "compare": None,
        "collection": "footwear",
        "image": "TaiLqg44CMxGOXKWtD4HkafU.png",
        "description": "The Horizon Glow Sneakers combine cutting-edge design with unmatched comfort. Featuring a vibrant gradient finish and a cushioned sole for all-day wear, these sneakers are perfect for both casual and active lifestyles. With breathable materials and durable construction, they're a stylish and practical choice for any wardrobe.",
        "variant_label": "Shoe size",
        "variants": ["6", "7", "8", "9", "10", "11", "12"],
        "section1_title": "Vibrant design that will turn heads",
        "section1_text": "The Horizon Glow Sneakers feature a stunning gradient finish that seamlessly blends bold colors for a look that stands out. Perfect for those who want to make a statement, these sneakers bring style and personality to every step you take.",
        "section2_title": "Unmatched comfort for all-day wear",
        "section2_text": "Built with a cushioned sole and breathable materials, these sneakers deliver comfort that lasts from morning to night. Durable construction ensures they keep up with your active lifestyle while looking effortlessly stylish.",
        "related": ["retro-handheld-console", "tropical-paradise-plant", "classic-off-white-trainers"],
    },
    "classic-off-white-trainers": {
        "name": "Classic Off-White Trainers",
        "price": "99.99",
        "compare": None,
        "collection": "footwear",
        "image": "9q9O56lpqUqJPoXiJkikhJuOb4M.png",
        "description": "The Classic Off-White Trainers are the perfect blend of style and versatility. With a sleek, minimal design and premium materials, these trainers offer durability and comfort for everyday wear. Whether paired with casual or smart outfits, they're an essential addition to any wardrobe.",
        "variant_label": "Shoe size",
        "variants": ["7", "8", "9", "10", "11", "12"],
        "section1_title": "Timeless design for every occasion",
        "section1_text": "The Classic Off-White Trainers feature a clean, minimalist design that pairs effortlessly with any outfit. From casual errands to smart-casual events, these versatile trainers are a wardrobe essential for modern style.",
        "section2_title": "All-day comfort you can rely on",
        "section2_text": "Crafted with premium materials and a cushioned sole, these trainers provide all-day comfort and support. Whether you're walking, working, or exploring, you'll experience unbeatable comfort with every step.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "tropical-paradise-plant"],
    },
    "vibrant-work-boots": {
        "name": "Vibrant Work Boots",
        "price": "129.99",
        "compare": None,
        "collection": "footwear",
        "image": "qdOdeRgSwlmLF7en894gIMaP2r8.png",
        "description": "These Vibrant Yellow Work Boots combine bold design with rugged functionality. Crafted with high-quality materials for durability, they feature a sturdy sole and cushioned interior for all-day comfort. Perfect for work or casual wear, these boots make a statement while keeping you comfortable and supported.",
        "variant_label": "Shoe size",
        "variants": ["6", "7", "8", "9", "10"],
        "section1_title": "Bold style meets rugged durability",
        "section1_text": "Stand out with boots that combine eye-catching design and lasting durability. The Vibrant Yellow Work Boots are built with tough materials and sturdy soles, making them perfect for demanding environments while keeping your look fresh and modern.",
        "section2_title": "Built for comfort and performance",
        "section2_text": "Designed for all-day wear, these boots feature a cushioned interior and supportive fit. Whether you're on the job or exploring the outdoors, they deliver comfort, grip, and confidence with every step.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "tropical-paradise-plant"],
    },
    "retro-handheld-console": {
        "name": "Retro Handheld Console",
        "price": "49.99",
        "compare": "59.99",
        "collection": "technology",
        "image": "oCDAVYb409OovtE2SNLVIPK7zxk.png",
        "description": "Relive the golden era of gaming with this portable Retro Handheld Console. With preloaded classic games and intuitive controls, it's perfect for gamers of all ages. The lightweight design ensures fun wherever you go.",
        "variant_label": "Color",
        "variants": ["Yellow", "Pink", "Blue"],
        "section1_title": "Designed for fun and portability",
        "section1_text": "This Retro Handheld Console brings the nostalgia of classic gaming to a modern, portable design. Its lightweight build ensures you can take it anywhere, while the intuitive controls make gaming effortless for players of all ages.",
        "section2_title": "Available in different configurations",
        "section2_text": "Express yourself with a console that matches your personality. Choose from a variety of vibrant colors and configurations designed to suit your preferences. Whether you prefer bold hues or subtle tones, there's an option to make this console uniquely yours.",
        "related": ["horizon-glow-sneakers", "tropical-paradise-plant", "classic-off-white-trainers"],
    },
    "vintage-mechanical-keyboard": {
        "name": "Vintage Mechanical Keyboard",
        "price": "149.99",
        "compare": "189.99",
        "collection": "technology",
        "image": "Jd50Ch6OeddkkWevou3JF5i44.png",
        "description": "The Vintage Mechanical Keyboard offers a perfect blend of nostalgia and functionality. Designed with tactile mechanical switches and a minimalist vintage look, it provides a responsive typing experience for gamers, writers, and professionals. Built to last, it's an elegant addition to any setup.",
        "variant_label": "Keyboard switch type",
        "variants": ["Tactile", "Clicky", "Linear"],
        "section1_title": "Retro design with modern performance",
        "section1_text": "The Vintage Mechanical Keyboard blends classic aesthetics with cutting-edge functionality. Its retro-inspired design adds timeless style to your setup, while modern mechanical switches ensure precise, responsive typing for work or play.",
        "section2_title": "Customize your typing experience",
        "section2_text": "Choose from tactile, clicky, or silent switches to match your preferences. Whether you're a writer, gamer, or professional, the Vintage Mechanical Keyboard offers a personalized typing experience designed to enhance comfort and performance.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "tropical-paradise-plant"],
    },
    "pro-audio-mixer": {
        "name": "Pro Audio Mixer",
        "price": "219.99",
        "compare": "249.99",
        "collection": "technology",
        "image": "d0WfiurbzWveXWLHiSEUzCwvLM.png",
        "description": "The Pro Audio Mixer delivers precision and versatility for all your audio needs. With intuitive controls, multiple channels, and a sleek design, it's perfect for music production, live streaming, and podcasting. Built for both beginners and professionals, it ensures high-quality sound and seamless control.",
        "variant_label": "Connectivity technology",
        "variants": ["Wireless", "Wired"],
        "section1_title": "Precision controls for perfect sound",
        "section1_text": "Take full control of your audio with intuitive knobs, sliders, and channels. The Pro Audio Mixer lets you fine-tune every detail, delivering crystal-clear sound for live streams, recordings, or performances.",
        "section2_title": "Versatile for creators and professionals",
        "section2_text": "Built for musicians, podcasters, and content creators, this mixer adapts to your needs. With multiple channels and configurations, it's the perfect tool for producing professional-grade audio with ease.",
        "related": ["retro-handheld-console", "horizon-glow-sneakers", "tropical-paradise-plant"],
    },
}

COLLECTIONS = {
    "home": {
        "name": "Home",
        "description": "Transform your living space with beautifully designed home essentials that bring comfort and style.",
        "products": ["tropical-paradise-plant", "potted-succulent-plant", "modern-lounge-armchair"],
    },
    "footwear": {
        "name": "Footwear",
        "description": "Step up your style with our collection of comfortable, versatile, and on-trend footwear for every occasion.",
        "products": ["horizon-glow-sneakers", "classic-off-white-trainers", "vibrant-work-boots"],
    },
    "technology": {
        "name": "Technology",
        "description": "Explore cutting-edge gadgets and devices designed to make your life easier and more entertaining.",
        "products": ["retro-handheld-console", "vintage-mechanical-keyboard", "pro-audio-mixer"],
    },
}

COLLECTION_NAMES = {slug: data["name"] for slug, data in COLLECTIONS.items()}

SHOP_ORDER = [
    "retro-handheld-console",
    "horizon-glow-sneakers",
    "tropical-paradise-plant",
    "classic-off-white-trainers",
    "vibrant-work-boots",
    "vintage-mechanical-keyboard",
    "pro-audio-mixer",
    "potted-succulent-plant",
    "modern-lounge-armchair",
]

PRODUCT_MEDIA = {
    "tropical-paradise-plant": {
        "gallery": ["tElJe5z6jmy6md1MRCKy40PRUc.png", "ButktGzkIv0yKhRg6NCyfcPkhU.png", "V2fytFa0Y7CuBzmFIdX87rybb4k.png"],
        "featured1": "ZiRTYCDC4SYkaQHUHwSo1yp1UA.png",
        "featured2": "AmUaE5XpqVjmdqSG4OU6zmxxiU.png",
    },
    "potted-succulent-plant": {
        "gallery": ["jSqxgKoxQZr1zZomzhjmmO2ew.png", "D1Ks6ljgiICuKZZMq18noSbgKg.png", "bp6VFPHlp4EAi4dTpW0N2XQ.png"],
        "featured1": "6j0VlDj7lpnUEwTR4i0eYVzOE.png",
        "featured2": "CQATwoslefB81Xu90Tcu0vhcgg.png",
    },
    "modern-lounge-armchair": {
        "gallery": ["wQCYenRpKmc9i0iVibBrrmx47s.png", "DXe0S3KEXuIjChhyae2jiRnHlp0.png", "TZRqj8dsSdECCYKPKuiVY5jEA4.png"],
        "featured1": "quGyUe58oP75sA8Wo9KInrryUQ0.png",
        "featured2": "R7Ce2wmeXeP2eR9gay4FKP6cJ8c.png",
    },
    "horizon-glow-sneakers": {
        "gallery": ["TaiLqg44CMxGOXKWtD4HkafU.png", "xp9dZsqF057ye6KdKXQyPfcIYW8.png", "bxemn25xmMnEjicZFdlKri36EWQ.png"],
        "featured1": "VklEFf5Lqo0RDvl0l75iVlSnDic.png",
        "featured2": "WBJbhomxBfJT7JajbT2uVjUfVk.png",
    },
    "classic-off-white-trainers": {
        "gallery": ["9q9O56lpqUqJPoXiJkikhJuOb4M.png", "GRiWfhCYkEyeuMOCC9Z2WPwQE.png", "KLmJr3iRKO6eafczOb9Tnc1A.png"],
        "featured1": "690qaEuNuT7kwZNl1TaBETriww.png",
        "featured2": "fLOHE8lkBnSSPoy2BvBB81HT3O4.png",
    },
    "vibrant-work-boots": {
        "gallery": ["qdOdeRgSwlmLF7en894gIMaP2r8.png", "gFQCuW9AckxJjPOJEJbsnZIUTo.png", "ddFIl6bsHtS0IiK8r24PXx4fkfQ.png"],
        "featured1": "j8MxZdmmCBC651BY92nYCSv0cg.png",
        "featured2": "rdpvYwPCzp5DgaweA0wGw1uJwiU.png",
    },
    "retro-handheld-console": {
        "gallery": ["oCDAVYb409OovtE2SNLVIPK7zxk.png", "6OUWUaEMnw1OkfUf8PvaWAku2A.png", "1eY1vErnVG3oaeUJpvuAONzGM.png"],
        "featured1": "mytMDxyVBcpXUjYLZbJ1InjD40.png",
        "featured2": "bntbj38MbrxQrm3oalaQLA6GrI.png",
    },
    "vintage-mechanical-keyboard": {
        "gallery": ["Jd50Ch6OeddkkWevou3JF5i44.png", "CQnELc4NkweovAWUSDYUiNeHI.png", "iKbnK1MxA6qCC4ma5q2XKsDV4.png"],
        "featured1": "iYaoLwdbw6j4Hi8x5ptrqKKto.png",
        "featured2": "sUZ64Y3IF6XBsnOyjwvHCEy8c8.png",
    },
    "pro-audio-mixer": {
        "gallery": ["d0WfiurbzWveXWLHiSEUzCwvLM.png", "gZ5thOcaIu2p1yNICFrzMzkueQ.png", "1GpIbb7tFF3pmkyT8vhYMphlZQ.png"],
        "featured1": "xKgEl1Y0lRI6fa4o7cKeA5zAtU.png",
        "featured2": "Zr2gmHqMFnwEKotKgFjp9nLXVY.png",
    },
}

PERKS = [
    ("30 Day Returns", "Enjoy hassle-free returns with our 30-day policy for peace of mind.", "arrow-clockwise.svg"),
    ("Next Day Delivery", "Get your order delivered fast with our reliable next-day delivery service.", "lightning.svg"),
    ("International Shipping", "Shop from anywhere with convenient worldwide shipping.", "globe.svg"),
    ("0% Finance Available", "Spread the cost of your purchase with 0% interest finance plans.", "credit-card.svg"),
]

STAR_SVG = '<svg viewBox="0 0 40 40" width="20" height="20" aria-hidden="true"><path d="M 18.097 2.289 C 18.693 0.441 21.307 0.441 21.903 2.289 L 25.136 12.312 C 25.403 13.14 26.174 13.7 27.044 13.698 L 37.575 13.675 C 39.517 13.671 40.325 16.158 38.751 17.296 L 30.218 23.467 C 29.513 23.977 29.219 24.884 29.489 25.71 L 32.765 35.719 C 33.37 37.565 31.254 39.101 29.686 37.957 L 21.179 31.748 C 20.477 31.235 19.523 31.235 18.821 31.748 L 10.314 37.957 C 8.746 39.101 6.63 37.565 7.235 35.719 L 10.511 25.71 C 10.781 24.884 10.487 23.977 9.782 23.467 L 1.249 17.296 C -0.325 16.158 0.483 13.671 2.425 13.675 L 12.956 13.698 C 13.826 13.7 14.597 13.14 14.864 12.312 Z" fill="currentColor"/></svg>'


def header(assets_prefix: str, current: str | None = None) -> str:
    links = [
        ("Shop", "/shop"),
        ("Collections", "/collections"),
        ("Blog", "/blog"),
        ("Support", "/support"),
    ]
    nav = "\n".join(
        f'              <li><a href="{href}"{" aria-current=\"page\"" if current == label else ""}>{label}</a></li>'
        for label, href in links
    )
    return f"""      <header class="header">
        <nav class="header__nav" aria-label="Main navigation">
          <div class="header__nav-inner">
            <div class="header__tab header__tab--logo">
              <a href="/" class="header__logo" aria-label="APC Containers home">
                <img
                  src="/assets/apc-logo.png"
                  alt="APC Containers"
                  width="64"
                  height="42"
                >
              </a>
              <div class="header__corner header__corner--bl header__corner--tab" aria-hidden="true">
                <svg viewBox="0 0 18 18" width="18" height="18">
                  <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                </svg>
              </div>
              <div class="header__corner header__corner--tr header__corner--tab" aria-hidden="true">
                <svg viewBox="0 0 18 18" width="18" height="18">
                  <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                </svg>
              </div>
            </div>

            <ul class="header__links">
{nav}
            </ul>

            <div class="header__tab header__tab--actions">
              <div class="header__icons">
                <button class="header__icon-btn" type="button" aria-label="Search">
                  <img class="header__icon-img" src="/assets/icons/magnifying-glass.svg" alt="" width="20" height="20" aria-hidden="true">
                </button>

                <button class="header__cart-btn" type="button" aria-label="Shopping cart, 0 items">
                  <span class="header__cart-icon" aria-hidden="true"></span>
                  <span class="header__cart-count">0</span>
                </button>

                <button class="header__menu-btn" type="button" aria-label="Open menu">
                  <img class="header__icon-img" src="/assets/icons/list.svg" alt="" width="20" height="20" aria-hidden="true">
                </button>
              </div>
              <div class="header__corner header__corner--bl header__corner--tab header__corner--tab-right" aria-hidden="true">
                <svg viewBox="0 0 18 18" width="18" height="18">
                  <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                </svg>
              </div>
              <div class="header__corner header__corner--tl header__corner--tab header__corner--tab-right" aria-hidden="true">
                <svg viewBox="0 0 18 18" width="18" height="18">
                  <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="header__corner header__corner--bl header__corner--nav" aria-hidden="true">
            <svg viewBox="0 0 18 18" width="18" height="18">
              <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
            </svg>
          </div>
          <div class="header__corner header__corner--tr header__corner--nav" aria-hidden="true">
            <svg viewBox="0 0 18 18" width="18" height="18">
              <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
            </svg>
          </div>
        </nav>
      </header>"""


def footer(assets_prefix: str) -> str:
    return f"""    <footer class="footer reveal">
      <div class="footer__logo-tab">
        <a href="/" class="footer__logo" aria-label="APC Containers home"><img src="/assets/apc-logo.png" alt="APC Containers" width="64" height="42"></a>
        <div class="footer__corner footer__corner--bl" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18">
            <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
          </svg>
        </div>
        <div class="footer__corner footer__corner--tr" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18">
            <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      <div class="footer__inner">
        <div class="footer__main">
          <div class="footer__newsletter">
            <div class="footer__newsletter-content">
              <h3 class="footer__heading">Join our newsletter and get 20% off your first purchase with us.</h3>
              <form class="footer__form" action="#" method="post">
                <input
                  type="email"
                  name="email"
                  class="footer__input"
                  placeholder="Your Email Address"
                  autocomplete="email"
                  required
                >
                <button type="submit" class="footer__submit">Join</button>
              </form>
            </div>
            <p class="footer__credit">
              Created by &copy; 2024
            </p>
          </div>

          <div class="footer__sitemap">
            <div class="footer__column">
              <p class="footer__column-title">Pages</p>
              <ul class="footer__links">
                <li><a href="/">Home</a></li>
                <li><a href="/shop">Shop</a></li>
                <li><a href="/collections">Collections</a></li>
                <li><a href="/blog">Blog</a></li>
              </ul>
            </div>
            <div class="footer__column">
              <p class="footer__column-title">Information</p>
              <ul class="footer__links">
                <li><a href="/terms-and-conditions">Terms &amp; Conditions</a></li>
                <li><a href="/privacy-policy">Privacy policy</a></li>
                <li><a href="/support">Support</a></li>
                <li><a href="/404">404</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>"""


def product_card(slug: str, assets_prefix: str) -> str:
    p = PRODUCTS[slug]
    col = COLLECTION_NAMES[p["collection"]]
    return f"""          <article class="product-card" data-category="{p['collection']}">
            <a href="/shop/{slug}" class="product-card__image-link card-hover">
              <img
                src="/assets/{p['image']}"
                alt="{p['name']}"
                width="400"
                height="400"
                loading="lazy"
              >
              <div class="card-action card-action--product" aria-hidden="true">
                <div class="card-action__shape">
                  <span class="card-action__scoop card-action__scoop--a" aria-hidden="true">
                    <img src="/assets/icons/corner-scoop.svg" alt="" width="18" height="18">
                  </span>
                  <span class="card-action__scoop card-action__scoop--b" aria-hidden="true">
                    <img src="/assets/icons/corner-scoop.svg" alt="" width="18" height="18">
                  </span>
                  <span class="card-action__btn">
                    <span class="card-action__icon">
                      <span class="card-action__icon-rotate">
                        <img src="/assets/icons/arrow-right.svg" alt="" width="20" height="20" aria-hidden="true">
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </a>
            <div class="product-card__content">
              <a href="/shop/{slug}" class="product-card__info">
                <h3 class="product-card__name">{p['name']}</h3>
                <div class="product-card__meta">
                  <span class="product-card__category">{col}</span>
                  <span class="product-card__price">USD ${p['price']}</span>
                </div>
              </a>
            </div>
          </article>"""


def shop_sidebar() -> str:
    categories = [
        ("all", "All", True),
        ("technology", "Technology", False),
        ("footwear", "Footwear", False),
        ("home", "Home", False),
    ]
    buttons = []
    for slug, label, active in categories:
        state = ' class="shop-sidebar__category is-active"' if active else ' class="shop-sidebar__category"'
        pressed = "true" if active else "false"
        buttons.append(
            f"""            <button type="button"{state} data-category="{slug}" aria-pressed="{pressed}">
              <span class="shop-sidebar__dot" aria-hidden="true"></span>
              <span class="shop-sidebar__label">{label}</span>
            </button>"""
        )
    category_buttons = "\n".join(buttons)
    return f"""        <aside class="shop-sidebar reveal" data-reveal-delay="80" aria-label="Shop categories">
          <div class="shop-sidebar__intro">
            <h2 class="shop-sidebar__title">Shop</h2>
            <p class="shop-sidebar__desc">Split your products into categories so visitors can easily navigate.</p>
          </div>
          <nav class="shop-sidebar__categories" aria-label="Filter by category">
{category_buttons}
          </nav>
        </aside>"""


def collection_page(slug: str) -> str:
    col = COLLECTIONS[slug]
    assets = "/"
    cards = "\n".join(product_card(p, assets) for p in col["products"])
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{col['name']} - APC Containers Pvt. Ltd.</title>
  <meta name="description" content="{col['description']}">
{BRAND_HEAD}
  <link rel="stylesheet" href="{assets}css/style.css">
</head>
<body>
  <div class="page">
    <section class="page-hero page-hero--collection" aria-labelledby="collection-page-title">
{header(assets, "Collections")}

      <div class="page-hero__intro">
        <div class="page-hero__text">
          <div class="page-hero__title-row">
            <a href="/collections" class="page-hero__title-prefix reveal reveal--hero" data-reveal-delay="200">Collection /</a>
            <h1 class="page-hero__title" id="collection-page-title" data-reveal-words="hero" data-reveal-words-base-delay="150" data-words-split="true">
              {split_reveal_words(col['name'])}
            </h1>
          </div>
          <p class="page-hero__subtitle" data-reveal-words="hero" data-reveal-words-base-delay="500" data-words-split="true">
            {split_reveal_words(col['description'])}
          </p>
        </div>
      </div>
    </section>

    <section class="collection-products" aria-label="{col['name']} products">
      <div class="collection-products__inner">
        <div class="popular__grid reveal" data-reveal-delay="120">
{cards}
        </div>
      </div>
    </section>

    <div class="spacer" aria-hidden="true"></div>

{footer(assets)}
  </div>

  <script src="{assets}js/animations.js"></script>
  <script src="{assets}js/main.js"></script>
  <script src="/js/search-cart.js"></script>
  <script src="/js/promo-modal.js"></script>
</body>
</html>
"""


def price_html(price: str, compare: str | None) -> str:
    if compare:
        return f"""              <div class="product-detail__price">
                <span class="product-detail__price-current">USD ${price}</span>
                <span class="product-detail__price-compare">USD ${compare}</span>
              </div>"""
    return f'              <div class="product-detail__price"><span class="product-detail__price-current">USD ${price}</span></div>'


def variant_buttons(variants: list[str]) -> str:
    buttons = []
    for i, v in enumerate(variants):
        active = " product-detail__variant--active" if i == 0 else ""
        buttons.append(
            f'                  <button type="button" class="product-detail__variant{active}" data-variant>{v}</button>'
        )
    return "\n".join(buttons)


def gallery_thumbs(slug: str, assets: str) -> str:
    media = PRODUCT_MEDIA[slug]
    thumbs = []
    for i, img in enumerate(media["gallery"]):
        active = " product-detail__thumb--active" if i == 0 else ""
        thumbs.append(
            f"""                <button type="button" class="product-detail__thumb{active}" data-gallery-thumb data-image="{assets}assets/{img}" aria-label="View product image {i + 1}">
                  <span class="product-detail__thumb-surface">
                    <img src="{assets}assets/{img}" alt="" width="84" height="84" loading="lazy">
                  </span>
                </button>"""
        )
    return "\n".join(thumbs)


def perk_cards(assets: str) -> str:
    cards = []
    for title, desc, icon in PERKS:
        cards.append(
            f"""          <article class="feature-card">
            <div class="feature-card__icon-tab" aria-hidden="true">
              <div class="feature-card__icon-shape">
                <span class="feature-card__icon-circle">
                  <img src="{assets}assets/icons/{icon}" alt="" width="20" height="20" aria-hidden="true">
                </span>
                <div class="feature-card__corner feature-card__corner--bl" aria-hidden="true">
                  <svg viewBox="0 0 18 18" width="18" height="18">
                    <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                  </svg>
                </div>
                <div class="feature-card__corner feature-card__corner--tr" aria-hidden="true">
                  <svg viewBox="0 0 18 18" width="18" height="18">
                    <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="feature-card__text">
              <h3 class="feature-card__title">{title}</h3>
              <p class="feature-card__desc">{desc}</p>
            </div>
          </article>"""
        )
    return "\n".join(cards)


def testimonials_section(assets: str) -> str:
    stars = STAR_SVG * 5
    return f"""    <section class="testimonials" aria-label="Customer testimonials">
      <div class="testimonials__nav-tab reveal" data-reveal-delay="80">
        <div class="testimonials__nav-inner">
          <button class="testimonials__nav-btn testimonials__nav-btn--prev" type="button" aria-label="Previous testimonial">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" aria-hidden="true">
              <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="testimonials__nav-btn testimonials__nav-btn--next" type="button" aria-label="Next testimonial">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" aria-hidden="true">
              <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div class="testimonials__corner testimonials__corner--bl" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18">
            <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
          </svg>
        </div>
        <div class="testimonials__corner testimonials__corner--tl" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18">
            <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      <div class="testimonials__inner">
        <div class="testimonials__main">
          <div class="testimonials__content reveal">
            <div class="testimonials__avatars">
              <img class="testimonials__avatar testimonials__avatar--active" data-slide="0" data-quote="Showcase customer testimonials that build trust and inspire confidence in your products." data-author="Your Customer" src="{assets}assets/4xOqsaG9Qn3OT6HvtyKhl9KOoWY.png" alt="" width="100" height="100" loading="lazy">
              <img class="testimonials__avatar" data-slide="1" data-quote="Showcase customer testimonials that build trust and inspire confidence in your products." data-author="Your Customer" src="{assets}assets/XB8s5Btp8gJ0QrUvAFXXD5vXPeU.png" alt="" width="100" height="100" loading="lazy">
              <img class="testimonials__avatar" data-slide="2" data-quote="Showcase customer testimonials that build trust and inspire confidence in your products." data-author="Your Customer" src="{assets}assets/Lu1xB2saHLKbEWEf6qQFuz93ejg.png" alt="" width="100" height="100" loading="lazy">
            </div>
            <div class="testimonials__quote-track">
              <h2 class="testimonials__quote testimonials__text-slide testimonials__text-slide--active" data-slide="0">Showcase customer testimonials that build trust and inspire confidence in your products.</h2>
              <h2 class="testimonials__quote testimonials__text-slide" data-slide="1">Showcase customer testimonials that build trust and inspire confidence in your products.</h2>
              <h2 class="testimonials__quote testimonials__text-slide" data-slide="2">Showcase customer testimonials that build trust and inspire confidence in your products.</h2>
            </div>
          </div>

          <div class="testimonials__customer reveal" data-reveal-delay="100">
            <div class="testimonials__stars" aria-label="5 out of 5 stars">
              {stars}
            </div>
            <div class="testimonials__author-track" aria-live="polite">
              <p class="testimonials__author testimonials__text-slide testimonials__text-slide--active" data-slide="0">Your Customer</p>
              <p class="testimonials__author testimonials__text-slide" data-slide="1">Your Customer</p>
              <p class="testimonials__author testimonials__text-slide" data-slide="2">Your Customer</p>
            </div>
          </div>
        </div>

        <div class="testimonials__logos reveal" data-reveal-delay="180">
          <p class="testimonials__logos-label">Feature client logos to build trust and credibility for your brand:</p>
          <div class="testimonials__logos-marquee" aria-hidden="false">
            <div class="testimonials__logos-track">
              <div class="testimonials__logos-set">
                <img src="{assets}assets/logos/logo-1.svg" alt="" width="159" height="18">
                <img src="{assets}assets/logos/logo-2.svg" alt="" width="87" height="20">
                <span class="testimonials__logo-group">
                  <img src="{assets}assets/logos/logo-3.svg" alt="" width="80" height="20">
                  <img src="{assets}assets/logos/logo-4.svg" alt="" width="37" height="25">
                </span>
                <img src="{assets}assets/logos/logo-5.svg" alt="" width="84" height="22">
              </div>
              <div class="testimonials__logos-set" aria-hidden="true">
                <img src="{assets}assets/logos/logo-1.svg" alt="" width="159" height="18">
                <img src="{assets}assets/logos/logo-2.svg" alt="" width="87" height="20">
                <span class="testimonials__logo-group">
                  <img src="{assets}assets/logos/logo-3.svg" alt="" width="80" height="20">
                  <img src="{assets}assets/logos/logo-4.svg" alt="" width="37" height="25">
                </span>
                <img src="{assets}assets/logos/logo-5.svg" alt="" width="84" height="22">
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>"""


def product_page(slug: str) -> str:
    p = PRODUCTS[slug]
    media = PRODUCT_MEDIA[slug]
    col_slug = p["collection"]
    col_name = COLLECTION_NAMES[col_slug]
    assets = "/"
    main_image = media["gallery"][0]
    related = "\n".join(product_card(r, assets) for r in p["related"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{p['name']} - APC Containers Pvt. Ltd.</title>
  <meta name="description" content="{p['description']}">
{BRAND_HEAD}
  <link rel="stylesheet" href="{assets}css/style.css">
</head>
<body>
  <div class="page">
    <section class="product-page" aria-labelledby="product-title">
{header(assets, "Shop")}

      <div class="product-page__body reveal">
        <div class="product-detail__layout">
          <div class="product-detail__media">
            <div class="product-detail__gallery-row">
              <div class="product-detail__thumbs" role="tablist" aria-label="Product images">
{gallery_thumbs(slug, assets)}
              </div>

              <div class="product-detail__main" data-product-zoom>
                <div class="product-detail__zoom-tab" aria-hidden="true">
                  <div class="product-detail__zoom-tab-shape">
                    <span class="product-detail__zoom-hint">Hover to zoom</span>
                    <div class="product-detail__zoom-corner product-detail__zoom-corner--br" aria-hidden="true">
                      <svg viewBox="0 0 18 18" width="18" height="18">
                        <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                      </svg>
                    </div>
                    <div class="product-detail__zoom-corner product-detail__zoom-corner--tl" aria-hidden="true">
                      <svg viewBox="0 0 18 18" width="18" height="18">
                        <path d="M 0 0 L 0 18 C 0 8.059 8.059 0 18 0 Z" fill="#ffffff"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="product-detail__main-inner">
                <img
                  class="product-detail__image"
                  src="{assets}assets/{main_image}"
                  alt="{p['name']}"
                  width="600"
                  height="600"
                >
                </div>
              </div>
            </div>
          </div>

          <div class="product-detail__info">
            <nav class="product-detail__breadcrumb" aria-label="Breadcrumb">
              <a href="/shop">Shop</a>
              <span class="product-detail__breadcrumb-sep" aria-hidden="true">&bull;</span>
              <a href="/collections/{col_slug}">{col_name}</a>
            </nav>

            <div class="product-detail__content">
              <div class="product-detail__main-info">
                <div class="product-detail__heading">
                  <h1 class="product-detail__title" id="product-title">{p['name']}</h1>
{price_html(p['price'], p['compare'])}
                </div>

                <p class="product-detail__description">{p['description']}</p>

                <div class="product-detail__options">
                  <p class="product-detail__option-label">{p['variant_label']}</p>
                  <div class="product-detail__variants">
{variant_buttons(p['variants'])}
                  </div>
                </div>
              </div>

              <div class="product-detail__purchase">
                <div class="product-detail__actions">
                  <button type="button" class="product-detail__btn product-detail__btn--cart">Add to Cart</button>
                  <button type="button" class="product-detail__btn product-detail__btn--buy">Buy Now</button>
                </div>

                <div class="product-detail__accordion">
                  <details class="product-detail__accordion-item" open>
                    <summary class="product-detail__accordion-summary">Warranty</summary>
                    <p class="product-detail__accordion-body">Every purchase is backed by our commitment to quality. Enjoy peace of mind with a 90-day warranty, ensuring your product delivers satisfaction and reliability.</p>
                  </details>
                  <details class="product-detail__accordion-item">
                    <summary class="product-detail__accordion-summary">Shipping Information</summary>
                    <p class="product-detail__accordion-body">We offer reliable and fast shipping to ensure your order reaches you on time. All orders are processed within 1&ndash;2 business days, with tracking provided for a seamless delivery experience.</p>
                  </details>
                  <details class="product-detail__accordion-item">
                    <summary class="product-detail__accordion-summary">Support</summary>
                    <p class="product-detail__accordion-body">Need assistance? Our support team is here to help. Contact us anytime for quick and reliable solutions to your questions or concerns.</p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="features features--product" aria-label="Shopping benefits">
        <div class="features__inner">
          <div class="features__grid reveal" data-reveal-delay="120">
{perk_cards(assets)}
          </div>
        </div>
      </section>
    </section>

    <section class="product-featured reveal" aria-label="Product highlight">
      <div class="product-featured__media">
        <img src="{assets}assets/{media['featured1']}" alt="" width="600" height="600" loading="lazy">
      </div>
      <div class="product-featured__text">
        <h2 class="product-featured__title">{p['section1_title']}</h2>
        <p class="product-featured__desc">{p['section1_text']}</p>
      </div>
    </section>

{testimonials_section(assets)}

    <section class="product-featured product-featured--reverse reveal" aria-label="Product highlight">
      <div class="product-featured__text">
        <h2 class="product-featured__title">{p['section2_title']}</h2>
        <p class="product-featured__desc">{p['section2_text']}</p>
      </div>
      <div class="product-featured__media">
        <img src="{assets}assets/{media['featured2']}" alt="" width="600" height="600" loading="lazy">
      </div>
    </section>

    <section class="popular popular--product" aria-labelledby="browse-more-title">
      <div class="popular__inner">
        <div class="popular__header reveal">
          <div class="popular__intro">
            <h2 class="popular__title" id="browse-more-title">Browse More</h2>
            <p class="popular__subtitle">Showcase more popular products here for visitors to explore.</p>
          </div>
          <a href="/shop" class="popular__link">
            View All
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"/>
            </svg>
          </a>
        </div>

        <div class="popular__grid reveal" data-reveal-delay="120">
{related}
        </div>
      </div>
    </section>

{footer(assets)}
  </div>

  <script src="{assets}js/animations.js"></script>
  <script src="{assets}js/main.js"></script>
  <script src="{assets}js/product.js"></script>
  <script src="/js/search-cart.js"></script>
  <script src="/js/promo-modal.js"></script>
</body>
</html>
"""


def shop_page() -> str:
    assets = "/"
    cards = "\n".join(product_card(slug, assets) for slug in SHOP_ORDER)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shop - APC Containers Pvt. Ltd.</title>
  <meta name="description" content="Use this page to display your full product collection, making it easy for customers to browse and shop.">
{BRAND_HEAD}
  <link rel="stylesheet" href="{assets}css/style.css">
</head>
<body>
  <div class="page">
    <section class="page-hero page-hero--shop" aria-labelledby="shop-page-title">
{header(assets, "Shop")}

      <div class="page-hero__intro">
        <span class="page-hero__badge reveal reveal--hero" data-reveal-delay="200">Shop</span>

        <div class="page-hero__text">
          <h1 class="page-hero__title" id="shop-page-title" data-reveal-words="hero" data-reveal-words-base-delay="150" data-words-split="true">
            {split_reveal_words("Showcase all your products in one place.")}
          </h1>
          <p class="page-hero__subtitle" data-reveal-words="hero" data-reveal-words-base-delay="500" data-words-split="true">
            {split_reveal_words("Use this page to display your full product collection, making it easy for customers to browse and shop.")}
          </p>
        </div>
      </div>
    </section>

    <section class="popular popular--page shop" aria-label="All products">
      <div class="shop__layout">
{shop_sidebar()}

        <div class="shop__products">
          <div class="popular__grid reveal" id="shop-grid" data-reveal-delay="120">
{cards}
          </div>
        </div>
      </div>
    </section>

    <div class="spacer" aria-hidden="true"></div>

{footer(assets)}
  </div>

  <script src="{assets}js/animations.js"></script>
  <script src="{assets}js/main.js"></script>
  <script src="/js/search-cart.js"></script>
  <script src="/js/promo-modal.js"></script>
</body>
</html>
"""


def legal_pages() -> dict[str, str]:
    assets = "/"
    terms_body = """
            <p class="legal__updated">Last Updated: January 2025</p>
            <p>Welcome to APC Containers. By using our website and services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully before using our site.</p>
            <p>By accessing our website, you confirm that you are at least 18 years old or have the legal authority to agree to these terms. You agree to use the site only for lawful purposes and in compliance with all applicable laws and regulations.</p>
            <p>All content on this website, including text, images, logos, graphics, and designs, is the property of APC Containers or its licensors and is protected by copyright and intellectual property laws. You may not reproduce, distribute, or use any content without prior written consent.</p>
            <p>If you submit content to us, such as feedback or testimonials, you grant APC Containers a non-exclusive, royalty-free, and irrevocable license to use, modify, and display the content for promotional or operational purposes.</p>
            <p>Our website and services are provided &ldquo;as is&rdquo; without any guarantees or warranties. While we strive to provide accurate and up-to-date information, we do not warrant the accuracy, reliability, or completeness of the content on our website.</p>
            <p>APC Containers is not liable for any indirect, incidental, or consequential damages arising from your use of our website or services. This includes, but is not limited to, loss of data, revenue, or profits.</p>
            <p>Our website may contain links to third-party websites. These links are provided for convenience, and APC Containers does not endorse or assume responsibility for the content or practices of these external sites.</p>
            <p>We reserve the right to terminate or suspend your access to our website without notice if you violate these terms or engage in any conduct that we consider harmful to our business or users.</p>
            <p>We may update these terms and conditions periodically to reflect changes in our practices or legal requirements. Your continued use of the website constitutes acceptance of any changes.</p>
            <p>These terms and conditions are governed by and construed in accordance with the laws of [Insert Jurisdiction]. Any disputes will be resolved in the courts of [Insert Jurisdiction].</p>"""

    privacy_body = """
            <p class="legal__updated">Last Updated: January 2025</p>
            <p>APC Containers (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your data when you interact with our website and services.</p>
            <p>We may collect the following types of information when you use our website or contact us:</p>
            <p><strong>Personal Information:</strong> Name, email address, phone number, and other information you provide through forms or correspondence.</p>
            <p><strong>Usage Data:</strong> Information about how you interact with our website, including your IP address, browser type, pages visited, and time spent on our site.</p>
            <p><strong>Cookies and Tracking Technologies:</strong> We use cookies to enhance your experience, analyze website traffic, and improve our services.</p>
            <p>We use the information collected to respond to inquiries and provide customer support, improve and optimize our website and services, send updates, newsletters, or promotional content (only with your consent), and comply with legal obligations.</p>
            <p>We do not sell or rent your personal information to third parties. However, we may share your information with service providers who assist us in operating our website or providing services, and with legal authorities if required by law or to protect our legal rights.</p>
            <p>You have the right to access the personal information we hold about you, request corrections to inaccurate or incomplete information, opt out of receiving marketing communications, and request the deletion of your data, subject to legal or contractual obligations.</p>
            <p>We implement reasonable security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of online transmission is completely secure, and we cannot guarantee absolute security.</p>
            <p>Our website may contain links to external websites. We are not responsible for the privacy practices of these third parties, and we encourage you to review their privacy policies.</p>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We encourage you to review this page periodically for updates.</p>"""

    def page(title: str, description: str, heading: str, body: str) -> str:
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - APC Containers Pvt. Ltd.</title>
  <meta name="description" content="{description}">
{BRAND_HEAD}
  <link rel="stylesheet" href="{assets}css/style.css">
</head>
<body>
  <div class="page">
    <section class="page-hero page-hero--legal" aria-labelledby="legal-page-title">
{header(assets)}

      <div class="page-hero__intro">
        <div class="page-hero__text">
          <h1 class="page-hero__title" id="legal-page-title" data-reveal-words="hero" data-reveal-words-base-delay="150" data-words-split="true">{split_reveal_words(heading)}</h1>
        </div>
      </div>
    </section>

    <section class="legal" aria-label="{heading}">
      <div class="legal__inner reveal" data-reveal-delay="120">
        <div class="legal__content">
{body}
        </div>
      </div>
    </section>

    <div class="spacer" aria-hidden="true"></div>

{footer(assets)}
  </div>

  <script src="{assets}js/animations.js"></script>
  <script src="{assets}js/main.js"></script>
  <script src="/js/search-cart.js"></script>
  <script src="/js/promo-modal.js"></script>
</body>
</html>"""

    return {
        "terms-and-conditions": page(
            "Terms & Conditions",
            "Terms and conditions for using the APC Containers website and services.",
            "Terms &amp; Conditions",
            terms_body,
        ),
        "privacy-policy": page(
            "Privacy Policy",
            "Privacy policy explaining how APC Containers collects, uses, and protects your data.",
            "Privacy Policy",
            privacy_body,
        ),
    }


def main() -> None:
    shop_path = ROOT / "shop" / "index.html"
    shop_path.write_text(shop_page(), encoding="utf-8")
    print(f"Wrote {shop_path.relative_to(ROOT)}")

    for slug in COLLECTIONS:
        path = ROOT / "collections" / slug / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(collection_page(slug), encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)}")

    for slug in PRODUCTS:
        path = ROOT / "shop" / slug / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(product_page(slug), encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)}")

    for slug, page_html in legal_pages().items():
        path = ROOT / slug / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page_html, encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
