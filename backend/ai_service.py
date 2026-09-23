"""
AI Service Layer for website code generation and modification.

Handles AI-powered code generation, debugging, refactoring,
enhancement and image-to-website generation.

Author: Gajanan Deshmukh
"""


import os
import base64
import logging
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

try:
    from mistralai import Mistral
except ImportError:
    Mistral = None

load_dotenv()

logger = logging.getLogger(__name__)

# ============================================================
# CONFIG
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_VISION_MODEL = os.getenv(
    "MISTRAL_VISION_MODEL",
    "ministral-14b-2512"
)

# ============================================================
# GROQ CLIENT
# ============================================================

groq_client = None

if GROQ_API_KEY:
    try:
        groq_client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )

        logger.info("Successfully initialized Groq client")
        logger.info("Base URL: https://api.groq.com/openai/v1")
        logger.info("Default Model: %s", GROQ_MODEL)

    except Exception:
        logger.exception("Failed to initialize Groq client")

# ============================================================
# MISTRAL CLIENT
# ============================================================

mistral_client = None

if MISTRAL_API_KEY and Mistral is not None:
    try:
        mistral_client = Mistral(
            api_key=MISTRAL_API_KEY
        )

        logger.info(
            "Successfully initialized Mistral Vision client"
        )
        logger.info(
            "Mistral Vision Model: %s",
            MISTRAL_VISION_MODEL
        )

    except Exception:
        logger.exception(
            "Failed to initialize Mistral client"
        )

# ============================================================
# NORMAL TEXT GENERATION
# ============================================================


def run_ai_completion(
    messages,
    model: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 12000
) -> str:

    if not groq_client:
        raise RuntimeError(
            "GROQ_API_KEY is not configured."
        )

    selected_model = model or GROQ_MODEL

    response = groq_client.chat.completions.create(
        model=selected_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )

    content = response.choices[0].message.content

    return content or ""


# ============================================================
# SCREENSHOT → DETAILED UI SPECIFICATION
# ============================================================


def analyze_screenshot_with_mistral(
    image_data_url: str,
    prompt: Optional[str] = None
) -> str:

    if not mistral_client:
        raise RuntimeError(
            "MISTRAL_API_KEY is not configured."
        )

    if not image_data_url.startswith("data:image/"):
        raise ValueError(
            "Invalid image data URL."
        )

    analysis_prompt = prompt or """
    You are an expert UI/UX designer, frontend engineer and
    visual reverse-engineering specialist.

    Analyze this website screenshot extremely carefully.

    The goal is NOT to give a generic description.

    I need a highly detailed specification that another AI can use
    to recreate the website as accurately as possible.

    Analyze EVERY visible element.

    ============================================================
    1. OVERALL PAGE
    ============================================================

    Describe:

    - page type
    - overall layout
    - desktop/mobile appearance
    - page width
    - content max-width
    - major sections
    - section ordering
    - alignment
    - horizontal and vertical spacing
    - margins
    - padding
    - gaps
    - whitespace
    - background areas

    ============================================================
    2. HEADER / NAVBAR
    ============================================================

    Describe:

    - header height
    - logo position
    - logo size
    - navigation position
    - navigation spacing
    - font family appearance
    - font size
    - font weight
    - text color
    - hover appearance if visually inferable
    - buttons
    - icons
    - borders
    - shadows
    - background
    - sticky/fixed appearance if inferable

    ============================================================
    3. HERO SECTION
    ============================================================

    Describe:

    - exact approximate height
    - text alignment
    - heading size
    - heading weight
    - heading line height
    - paragraph size
    - paragraph width
    - button dimensions
    - button radius
    - button colors
    - button spacing
    - image position
    - image dimensions
    - image cropping
    - decorative elements

    ============================================================
    4. SECTIONS
    ============================================================

    For EVERY section:

    - section name/purpose
    - width
    - height
    - background
    - padding
    - alignment
    - columns
    - rows
    - spacing

    ============================================================
    5. CARDS
    ============================================================

    For EVERY visible card:

    - width
    - height
    - border radius
    - border
    - shadow
    - background
    - internal padding
    - icon position
    - title position
    - description
    - buttons
    - spacing between cards

    ============================================================
    6. TYPOGRAPHY
    ============================================================

    Estimate:

    - font family
    - heading sizes
    - body sizes
    - small text sizes
    - font weights
    - line heights
    - letter spacing
    - text colors
    - hierarchy

    Use approximate pixel values where possible.

    ============================================================
    7. COLORS
    ============================================================

    Identify approximate colors for:

    - body background
    - section backgrounds
    - primary color
    - secondary color
    - heading color
    - body text
    - muted text
    - borders
    - buttons
    - cards
    - accents

    Give HEX values where reasonably possible.

    ============================================================
    8. BUTTONS
    ============================================================

    For EVERY button:

    - text
    - width
    - height
    - padding
    - border radius
    - background
    - text color
    - font size
    - font weight
    - icon
    - position
    - spacing

    ============================================================
    9. IMAGES / ICONS
    ============================================================

    Describe:

    - image locations
    - approximate dimensions
    - aspect ratio
    - border radius
    - object-fit/cropping
    - icons
    - icon sizes
    - icon positions

    If exact image source cannot be known, describe the required
    visual characteristics instead of inventing a URL.

    ============================================================
    10. BORDERS / SHADOWS
    ============================================================

    Describe:

    - border widths
    - border colors
    - radius
    - box shadows
    - shadow blur
    - shadow spread
    - shadow direction/intensity

    ============================================================
    11. RESPONSIVE DESIGN
    ============================================================

    Infer how the design should behave on:

    - desktop
    - tablet
    - mobile

    Describe:

    - columns becoming rows
    - navbar collapsing
    - text resizing
    - cards stacking
    - image resizing
    - spacing changes

    Every website must include relevant, high-quality images
    whenever images improve the design or are part of the
    requested website type.

    IMAGE REQUIREMENTS:

    1. Automatically identify suitable images based on the
       website category, content and individual sections.

    2. Use relevant images for:
       - Hero sections
       - Product cards
       - Service cards
       - Blog cards
       - Background sections
       - About sections
       - Gallery sections
       - Testimonials when appropriate
       - Banners and promotional sections

    3. Do not use the same image repeatedly unless it is
       intentionally required.

    4. Do not use random unrelated images.

    5. Images must match the website content, theme and design.

    6. Use image URLs from reliable, publicly accessible image
       sources when external images are appropriate.

    7. Prefer image sources such as:
       - Unsplash Source or Unsplash
       - Pexels
       - Pixabay
       - Wikimedia Commons
       - User-provided images
       - Project assets

    8. Do not use Google Images search-result page URLs as
       image sources.

    9. Do not invent image URLs that are likely to be broken.

    10. When a reliable image source is unavailable, use a
        meaningful placeholder with a clear description,
        not an unrelated image.

    11. Use images with appropriate:
        - aspect ratio
        - object-fit: cover or contain
        - border-radius
        - responsive sizing
        - accessible alt text
        - lazy loading where appropriate

    12. For hero backgrounds:
        - Use a relevant background image when suitable.
        - Ensure text remains readable with an overlay.
        - Use background-size: cover.
        - Use background-position: center.

    13. For product websites:
        - Use different relevant images for different products.
        - Maintain consistent image dimensions.
        - Do not display generic placeholders when suitable
          product images are available.

    14. For websites with no need for images, do not force
        unnecessary images into every section.

    15. Preserve existing user-provided image URLs and assets
        unless the user explicitly requests a replacement.

    16. When external images are unavailable, create a clean
        CSS-based fallback or image placeholder.

    17. Never use copyrighted images irresponsibly. Prefer
        appropriately licensed or openly usable image sources.

    18. Return complete working image references in the
        generated HTML, CSS or React code.

    ============================================================
    12. COMPLETE LAYOUT MAP
    ============================================================

    Finally produce a structured layout tree like:

    BODY
    ├── HEADER
    │    ├── LOGO
    │    ├── NAVIGATION
    │    └── CTA BUTTON
    │
    ├── HERO
    │    ├── CONTENT
    │    └── IMAGE
    │
    ├── FEATURES
    │    ├── CARD
    │    ├── CARD
    │    └── CARD
    │
    └── FOOTER

    ============================================================

    IMPORTANT:

    Do NOT give a short generic description.

    Do NOT say things like:

    "modern design"
    "beautiful layout"
    "professional website"

    Instead provide concrete visual information.

    The final result should be detailed enough that a frontend AI
    can recreate the screenshot with very high visual similarity.

    Return ONLY the detailed UI specification.
    """

    response = mistral_client.chat.complete(
        model=MISTRAL_VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": analysis_prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": image_data_url
                    }
                ]
            }
        ],
        temperature=0.1,
        max_tokens=8000
    )

    return response.choices[0].message.content or ""


# ============================================================
# SCREENSHOT → WEBSITE
# ============================================================


def run_vision_to_website(
    image_data_url: str,
    prompt: str = "",
    existing_code: str = ""
) -> str:

    logger.info(
        "Starting Screenshot → Website analysis"
    )

    ui_spec = analyze_screenshot_with_mistral(
        image_data_url=image_data_url
    )

    website_prompt = f"""
    You are an expert frontend engineer.

    You are given a detailed UI specification generated from
    a website screenshot.

    Your task is to recreate the website as accurately as possible.

    ============================================================
    UI SPECIFICATION
    ============================================================

    {ui_spec}

    ============================================================
    USER REQUEST
    ============================================================

    {prompt or "Recreate this website from the screenshot."}

    ============================================================
    EXISTING PROJECT
    ============================================================

    {existing_code if existing_code else "No existing project."}

    ============================================================
    IMPORTANT
    ============================================================

    Generate a complete responsive website.

    Requirements:

    1. Preserve the visual structure from the screenshot.

    2. Match:
    - spacing
    - typography
    - colors
    - borders
    - shadows
    - sizes
    - alignment
    - responsive behavior

    3. Do not invent unnecessary sections.

    4. Do not remove existing functionality when modifying
    an existing project.

    5. If existing code is provided, modify the existing project
    instead of creating an unrelated website.

    6. Use semantic HTML.

    7. Use responsive CSS.

        
    8. Use relevant external image URLs when they improve the
    visual accuracy and quality of the website.

    9. If the screenshot contains images and their original source
    is unknown, select visually similar images from reliable
    public image sources when available.

    10. Do not invent broken image URLs.

    11. If no reliable image source is available, use a meaningful
        placeholder or a CSS-based fallback.

    12. Preserve the screenshot's image layout, dimensions,
        cropping, aspect ratio and positioning.

    13. Use background images for visually appropriate hero
        and banner sections when required.

    14. Make all image usage responsive and accessible.

    Return:

    ```html
    <!-- complete HTML -->
    /* complete CSS */
    // complete JavaScript

    """

    result = run_ai_completion(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert frontend engineer "
                    "specialized in screenshot-to-code "
                    "website reconstruction."
                )
            },
            {
                "role": "user",
                "content": website_prompt
            }
        ],
        model=GROQ_MODEL,
        temperature=0.2,
        max_tokens=16000
    )

    return result


# ============================================================
# BUILD MESSAGES
# ============================================================


def build_messages(
    prompt: str,
    existing_code: str = "",
    modification_type: str = "CREATE"
):
    messages = []

    system_message = """
    You are BuildCode AI.

    You are an expert Python developer, FastAPI developer, React
    developer, frontend engineer, UI/UX engineer, GenAI engineer,
    and multi-page website architect.

    Generate production-quality, complete and functional websites.

    ============================================================
    WEBSITE ARCHITECTURE
    ============================================================

    First understand the user's requested website type and required
    functionality.

    Simple portfolios, landing pages and informational websites should
    stay appropriately simple.

    Complex websites such as e-commerce stores, booking systems,
    SaaS applications, dashboards, business applications and portals
    should use a multi-page architecture when multiple workflows
    naturally require separate pages.

    Do NOT create unnecessary pages.

    ============================================================
    MULTI-PAGE / ROUTING
    ============================================================

    When multiple pages are appropriate, create clear working routes
    such as:

    Home, About, Services, Products, Product Details, Categories,
    Cart, Checkout, Login, Register, Profile, Orders, Contact,
    Admin Dashboard.

    Select only pages relevant to the user's request.

    For vanilla HTML/CSS/JS projects, implement lightweight client-side
    routing/page switching that works in the generated standalone
    preview.

    For React projects, use React Router when appropriate.

    Navigation links must actually navigate to the intended page.
    Do not use dead links such as href="#" for required functionality.

    Shared navigation, authentication state, cart state and application
    data must remain consistent across pages and browser refreshes.

    ============================================================
    SHARED DATA / STATE
    ============================================================

    Preserve the existing client-side localStorage data layer.

    Use shared keys when applicable:
    app_users
    app_current_user
    app_products
    app_cart
    app_orders
    app_contacts
    app_wishlist
    app_settings

    All pages must read and update the same data instead of creating
    isolated duplicate state.

    ============================================================
    CONNECTED USER FLOWS
    ============================================================

    Make workflows actually connect between pages.

    Examples:
    Product -> Product Details -> Cart -> Checkout -> Order
    Register -> Login -> Profile
    Login -> Orders
    Contact Form -> saved contact
    Admin -> products/orders/users/contacts when applicable

    Buttons must perform meaningful actions and provide feedback.

    ============================================================
    CODE QUALITY
    ============================================================

    Generate complete runnable code.

    Do not reference files that were not generated.

    If the generator requires a standalone HTML/CSS/JS response,
    keep the application self-contained and implement routing/data
    functionality inside the JavaScript.

    If a real multi-file project structure is supported, separate
    pages, styles, scripts and reusable modules appropriately.

    ============================================================
    DEMO SECURITY
    ============================================================

    localStorage authentication is DEMO/PROTOTYPE functionality only.
    Never claim that browser storage provides production security.

    Never expose API keys, database passwords or private backend
    secrets in frontend code.

    ============================================================
    EXISTING PROJECT
    ============================================================

    For modification requests, preserve existing functionality,
    visual design and data unless the user explicitly asks to change
    them.

    Add requested functionality without unnecessarily deleting working
    features.

    ============================================================
    QUALITY
    ============================================================

    Websites should feel like real applications, not one extremely
    long static page.

    Include when appropriate:
    - responsive desktop/tablet/mobile design
    - realistic demo data
    - validation
    - loading, empty, success and error states
    - useful toasts/modals
    - accessible forms and buttons
    - consistent navigation
    - functional interactions

    Always return clearly separated HTML, CSS and JavaScript code
    blocks when applicable.

    Every website must include relevant, high-quality images
    whenever images improve the design or are part of the
    requested website type.

    IMAGE REQUIREMENTS:

    1. Automatically identify suitable images based on the
       website category, content and individual sections.

    2. Use relevant images for:
       - Hero sections
       - Product cards
       - Service cards
       - Blog cards
       - Background sections
       - About sections
       - Gallery sections
       - Testimonials when appropriate
       - Banners and promotional sections

    3. Do not use the same image repeatedly unless it is
       intentionally required.

    4. Do not use random unrelated images.

    5. Images must match the website content, theme and design.

    6. Use image URLs from reliable, publicly accessible image
       sources when external images are appropriate.

    7. Prefer image sources such as:
       - Unsplash Source or Unsplash
       - Pexels
       - Pixabay
       - Wikimedia Commons
       - User-provided images
       - Project assets

    8. Do not use Google Images search-result page URLs as
       image sources.

    9. Do not invent image URLs that are likely to be broken.

    10. When a reliable image source is unavailable, use a
        meaningful placeholder with a clear description,
        not an unrelated image.

    11. Use images with appropriate:
        - aspect ratio
        - object-fit: cover or contain
        - border-radius
        - responsive sizing
        - accessible alt text
        - lazy loading where appropriate

    12. For hero backgrounds:
        - Use a relevant background image when suitable.
        - Ensure text remains readable with an overlay.
        - Use background-size: cover.
        - Use background-position: center.

    13. For product websites:
        - Use different relevant images for different products.
        - Maintain consistent image dimensions.
        - Do not display generic placeholders when suitable
          product images are available.

    14. For websites with no need for images, do not force
        unnecessary images into every section.

    15. Preserve existing user-provided image URLs and assets
        unless the user explicitly requests a replacement.

    16. When external images are unavailable, create a clean
        CSS-based fallback or image placeholder.

    17. Never use copyrighted images irresponsibly. Prefer
        appropriately licensed or openly usable image sources.

    18. Return complete working image references in the
        generated HTML, CSS or React code.
        
    """

    messages.append(
        {
            "role": "system",
            "content": system_message
        }
    )

    context = f"""
    USER REQUEST:
    {prompt}

    MODIFICATION TYPE:
    {modification_type}
    """

    if existing_code.strip():
        context += (
            """

    FULL EXISTING PROJECT CODE:

    """
            + existing_code
            + """

    IMPORTANT:
    Preserve existing functionality unless the user explicitly
    asks to remove it.
    """
        )

    messages.append(
        {
            "role": "user",
            "content": context
        }
    )

    return messages