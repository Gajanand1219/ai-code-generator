"""
Utility functions for the AI Code Generator.

Handles code extraction, validation, cleanup
and common HTML, CSS and JavaScript processing.

Author: Gajanan Deshmukh
"""

import re
import logging
import uuid
from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime

# Import CodeSession from models
from models import CodeSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("autogen-backend")

# Import configuration from models
from models import (
    GROQ_BASE_URL,
    ANTHROPIC_API_KEY,
    GOOGLE_API_KEY,
    API_PORT
)

# ========== Helper Functions ==========
def find_matching_tag(html: str, start_pos: int, tag: str) -> Optional[int]:
    """Find the matching closing tag for an opening tag"""
    depth = 0
    i = start_pos
    
    while i < len(html):
        # Find next opening tag
        open_match = re.search(rf'<\s*{tag}[^>]*>', html[i:], re.IGNORECASE)
        if not open_match:
            break
        
        open_pos = i + open_match.start()
        
        # Find next closing tag
        close_match = re.search(rf'</\s*{tag}\s*>', html[open_pos:], re.IGNORECASE)
        if not close_match:
            break
        
        close_pos = open_pos + close_match.end()
        
        # Check if this is our target tag
        if depth == 0 and open_pos == start_pos:
            # This is our tag, find its closing
            nested_close = find_matching_tag_simple(html, open_pos, tag)
            if nested_close:
                return nested_close
        
        i = close_pos
        depth += 1
    
    return None

def find_matching_tag_simple(html: str, start_pos: int, tag: str) -> Optional[int]:
    """Simplified matching tag finder"""
    stack = []
    i = start_pos
    
    while i < len(html):
        # Find opening tag
        open_match = re.search(rf'<\s*{tag}[^>]*>', html[i:], re.IGNORECASE)
        if not open_match:
            break
        
        open_pos = i + open_match.start()
        
        # Find closing tag
        close_match = re.search(rf'</\s*{tag}\s*>', html[open_pos:], re.IGNORECASE)
        if not close_match:
            break
        
        close_pos = open_pos + close_match.end()
        
        stack.append(open_pos)
        
        # Check if this closes our starting tag
        if len(stack) == 1 and open_pos == start_pos:
            return close_pos
        
        # Remove from stack if we found a pair
        if len(stack) > 1:
            stack.pop()
        
        i = close_pos
    
    return None

# ========== Advanced Code Analysis ==========
class CodeAnalyzer:
    """Advanced HTML/CSS/JS analysis for intelligent modifications"""
    
    @staticmethod
    def analyze_structure(code: str) -> Dict[str, Any]:
        """Deep analysis of code structure"""
        analysis = {
            "type": "unknown",
            "components": [],
            "forms": [],
            "buttons": [],
            "links": [],
            "styles": [],
            "scripts": [],
            "layout": {},
            "classes": set(),
            "ids": set()
        }
        
        # HTML analysis
        html_match = re.search(r"(<\s*html[^>]*>.*?</html>)", code, re.DOTALL | re.IGNORECASE)
        if html_match:
            html_content = html_match.group(1)
            analysis["type"] = "full_page"
            
            # Extract forms
            form_pattern = r"(<\s*form[^>]*>.*?</form>)"
            forms = re.findall(form_pattern, html_content, re.DOTALL | re.IGNORECASE)
            for form in forms:
                form_name = re.search(r'name\s*=\s*["\']([^"\']+)["\']', form, re.IGNORECASE)
                form_id = re.search(r'id\s*=\s*["\']([^"\']+)["\']', form, re.IGNORECASE)
                analysis["forms"].append({
                    "html": form[:200] + "..." if len(form) > 200 else form,
                    "name": form_name.group(1) if form_name else "unnamed",
                    "id": form_id.group(1) if form_id else None,
                    "has_login": "login" in form.lower() or "username" in form.lower(),
                    "has_register": "register" in form.lower() or "signup" in form.lower()
                })
            
            # Extract buttons
            button_pattern = r'<button[^>]*>(.*?)</button>'
            buttons = re.findall(button_pattern, html_content, re.DOTALL | re.IGNORECASE)
            analysis["buttons"] = [b.strip() for b in buttons if b.strip()]
            
            # Extract links
            link_pattern = r'<a[^>]*href=["\'][^"\']*["\'][^>]*>(.*?)</a>'
            links = re.findall(link_pattern, html_content, re.DOTALL | re.IGNORECASE)
            analysis["links"] = [l.strip() for l in links if l.strip()]
            
            # Extract CSS classes
            class_pattern = r'class\s*=\s*["\']([^"\']+)["\']'
            classes = re.findall(class_pattern, html_content, re.IGNORECASE)
            for cls in classes:
                analysis["classes"].update(cls.split())
            
            # Extract IDs
            id_pattern = r'id\s*=\s*["\']([^"\']+)["\']'
            ids = re.findall(id_pattern, html_content, re.IGNORECASE)
            analysis["ids"].update(ids)
        
        # CSS analysis
        style_pattern = r"<style[^>]*>(.*?)</style>"
        style_match = re.search(style_pattern, code, re.DOTALL | re.IGNORECASE)
        if style_match:
            css_content = style_match.group(1)
            # Extract CSS rules
            rule_pattern = r"([^{]+\{[^}]+\})"
            rules = re.findall(rule_pattern, css_content)
            analysis["styles"] = rules[:10]  # Limit to first 10 rules
        
        # JS analysis
        script_pattern = r"<script[^>]*>(.*?)</script>"
        script_match = re.search(script_pattern, code, re.DOTALL | re.IGNORECASE)
        if script_match:
            js_content = script_match.group(1)
            # Extract function names
            func_pattern = r"function\s+(\w+)\s*\("
            functions = re.findall(func_pattern, js_content)
            analysis["scripts"] = functions
        
        analysis["classes"] = list(analysis["classes"])
        analysis["ids"] = list(analysis["ids"])
        
        return analysis
    
    @staticmethod
    def find_modification_points(code: str, request: str) -> List[Dict[str, Any]]:
        """Find specific points in code where modifications should be made"""
        points = []
        
        # Check for login-related modifications
        if any(word in request.lower() for word in ["register", "signup", "sign up"]):
            # Find login forms
            form_pattern = r"(<\s*form[^>]*>.*?</form>)"
            forms = re.finditer(form_pattern, code, re.DOTALL | re.IGNORECASE)
            
            for i, form_match in enumerate(forms):
                form_html = form_match.group(1)
                form_text = form_match.group(0)
                
                # Check if this is a login form
                if any(word in form_html.lower() for word in ["login", "username", "password"]):
                    # Find where form ends
                    end_pos = form_match.end()
                    
                    # Find the container div around the form
                    container_start = code.rfind('<div', 0, form_match.start())
                    if container_start != -1:
                        # Find matching closing div
                        container_end = find_matching_tag(code, container_start, 'div')
                        if container_end:
                            points.append({
                                "type": "add_register_link",
                                "position": "after_form",
                                "location": end_pos,
                                "form_index": i,
                                "container_start": container_start,
                                "container_end": container_end,
                                "suggestion": "Add registration link below login form",
                                "context": "Login form found"
                            })
        
        # Check for theme/color modifications
        if any(word in request.lower() for word in ["theme", "color", "background", "dark", "light"]):
            # Find style tags or inline styles
            style_pattern = r"(<\s*style[^>]*>.*?</style>)"
            style_matches = list(re.finditer(style_pattern, code, re.DOTALL | re.IGNORECASE))
            
            if style_matches:
                for i, style_match in enumerate(style_matches):
                    points.append({
                        "type": "modify_theme",
                        "position": "in_style",
                        "location": style_match.start(),
                        "style_index": i,
                        "suggestion": "Modify CSS colors and theme variables",
                        "context": f"Style tag found ({len(style_match.group(1))} chars)"
                    })
            
            # Also check for inline styles
            inline_pattern = r'style\s*=\s*["\'][^"\']*["\']'
            inline_matches = list(re.finditer(inline_pattern, code, re.IGNORECASE))
            if inline_matches:
                points.append({
                    "type": "modify_inline_styles",
                    "position": "inline",
                    "location": inline_matches[0].start(),
                    "count": len(inline_matches),
                    "suggestion": "Update inline styles for theme consistency"
                })
        
        # Check for responsive design modifications
        if any(word in request.lower() for word in ["responsive", "mobile", "tablet", "screen"]):
            # Look for media queries
            media_pattern = r"@media[^{]+\{[^}]+\}"
            if re.search(media_pattern, code, re.DOTALL):
                points.append({
                    "type": "enhance_responsive",
                    "position": "in_css",
                    "suggestion": "Add or modify media queries for better responsiveness"
                })
            else:
                points.append({
                    "type": "add_responsive",
                    "position": "end_of_style",
                    "suggestion": "Add responsive media queries for mobile/tablet"
                })
        
        return points

class CodeModifier:
    """Intelligent code modification based on analysis"""
    
    @staticmethod
    def create_context_prompt(existing_code: str, request: str, modification_type: str) -> str:
        """Create detailed context for the AI about what to modify"""
        
        analysis = CodeAnalyzer.analyze_structure(existing_code)
        points = CodeAnalyzer.find_modification_points(existing_code, request)
        
        context = f"""EXISTING CODE ANALYSIS:
        
Type: {analysis['type']}
Forms found: {len(analysis['forms'])}
Buttons: {analysis['buttons'][:5]}...
Links: {analysis['links'][:5]}...
CSS Classes used: {', '.join(analysis['classes'][:10])}
IDs used: {', '.join(analysis['ids'][:10])}
JavaScript functions: {', '.join(analysis['scripts'][:5])}

MODIFICATION REQUEST:
{request}

MODIFICATION TYPE: {modification_type}

SPECIFIC MODIFICATION POINTS IDENTIFIED:
"""
        
        for i, point in enumerate(points[:5]):  # Limit to 5 points
            context += f"\n{i+1}. {point['type']}: {point['suggestion']} (context: {point.get('context', 'N/A')})"
        
        context += "\n\nMODIFICATION GUIDELINES:\n"
        
        if modification_type == "modify":
            context += """1. MODIFY THE EXISTING PROJECT; DO NOT CREATE A NEW PROJECT.
2. Return the COMPLETE updated project code.
3. Preserve every existing feature unless explicitly asked to remove it.
4. Keep the same structure, UI, content, CSS, and JavaScript wherever possible.
5. Make ONLY the requested changes.
6. Do not replace the existing application with an unrelated implementation.
7. Integrate the requested change into the current code.
"""
        elif modification_type == "enhance":
            context += """1. ADD THE REQUESTED FEATURE TO THE EXISTING PROJECT.
2. Return the COMPLETE updated project code.
3. Preserve all existing functionality and UI.
4. Integrate the feature into the current HTML/CSS/JavaScript.
5. Do not rebuild the project from scratch.
6. Do not remove unrelated functionality.
"""
        elif modification_type == "debug":
            context += """1. FIX THE BUG IN THE EXISTING PROJECT.
2. Return the COMPLETE corrected project code.
3. Preserve all existing features and design.
4. Change only what is necessary to fix the reported bug.
5. Do not create a replacement or unrelated application.
"""
        elif modification_type == "refactor":
            context += """1. REFACTOR THE EXISTING PROJECT, DO NOT REBUILD IT AS A DIFFERENT PROJECT.
2. Return the COMPLETE refactored project code.
3. Preserve the existing UI, behavior, and features.
4. Improve structure and maintainability without removing functionality.
"""

        # Specific guidance for common requests
        if "register" in request.lower() and "login" in existing_code.lower():
            context += """

SPECIFIC INSTRUCTIONS FOR ADDING REGISTRATION:
1. Add a link or button saying "Don't have an account? Register here" or similar
2. Place it below the login form or in a logical location
3. The link can point to "#" or trigger a registration modal
4. Style it to match the existing login form
5. If there's space, consider adding a simple registration form
6. Use similar class names as the login form for consistency
"""
        
        if "theme" in request.lower() or "color" in request.lower():
            context += """

SPECIFIC INSTRUCTIONS FOR THEME MODIFICATION:
1. Update CSS color variables or direct color values
2. Maintain contrast ratios for accessibility
3. Update all related elements (buttons, inputs, backgrounds)
4. Consider adding a CSS variables section if not present
5. Test that text remains readable
"""
        
        # Pass the COMPLETE existing project to the model.
        # The old 2000-character limit caused the model to lose most
        # of the project and generate a different/new application.
        context += (
            "\n\nFULL EXISTING PROJECT CODE — PRESERVE THIS PROJECT:\n"
            "```html\n"
            + existing_code
            + "\n```"
        )
        
        return context

# ========== Session Management ==========
class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, CodeSession] = {}
    
    def create_session(self, prompt: str) -> str:
        """Create a new code generation session"""
        session_id = str(uuid.uuid4())
        now = datetime.now()
        session = CodeSession(
            session_id=session_id,
            original_prompt=prompt,
            current_code="",
            html_part="",
            css_part="",
            js_part="",
            modification_history=[],
            created_at=now,
            updated_at=now
        )
        self.sessions[session_id] = session
        return session_id
    
    def get_session(self, session_id: str) -> Optional[CodeSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: str, full_code: str, html: str, css: str, js: str, modification: Dict[str, Any]):
        """Update session with new code"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        session.current_code = full_code
        session.html_part = html
        session.css_part = css
        session.js_part = js
        session.modification_history.append(modification)
        session.updated_at = datetime.now()
        return True
    
    def delete_session(self, session_id: str):
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]

# ========== AI Model Functions ==========
def calculate_temperature(creativity_level: int, is_modification: bool) -> float:
    """Convert creativity level (1-10) to temperature (0.1-1.0)"""
    # Ensure creativity_level is within bounds
    creativity_level = max(1, min(10, creativity_level))
    
    # For GPT-5.2-chat on Azure, based on error logs, temperature might be fixed
    # Many Azure deployments have fixed temperature settings
    # We'll return None to indicate no temperature parameter should be sent
    
    
    def calculate_temperature(
        creativity_level: int,
        is_modification: bool
    ) -> float:
        """
        Convert creativity level (1-10)
        to Groq temperature.
        """

        creativity_level = max(
            1,
            min(10, creativity_level)
        )

        if creativity_level <= 3:
            return 0.3

        elif creativity_level <= 6:
            return 0.5

        elif creativity_level <= 8:
            return 0.7

        else:
            return 0.9
    
    

# ========== Code Processing Functions ==========
CODE_BLOCK_RE = re.compile(
    r"```(?:\s*(?P<lang>html|css|javascript|js))?\s*\n(?P<code>.*?)(?:```)",
    re.IGNORECASE | re.DOTALL
)

def extract_code_blocks(content: str) -> Dict[str, str]:
    """Extract code blocks from markdown format"""
    html = ""
    css = ""
    js = ""

    matches = list(CODE_BLOCK_RE.finditer(content))
    if matches:
        for m in matches:
            lang = (m.group("lang") or "").lower()
            code = m.group("code").strip()
            if lang in ("html", ""):
                html += code + "\n"
            elif lang in ("css",):
                css += code + "\n"
            elif lang in ("javascript", "js"):
                js += code + "\n"
    else:
        # No code blocks found, assume HTML
        html = content.strip()

    return {"html": html.strip(), "css": css.strip(), "js": js.strip()}

def combine_code(html: str, css: str, js: str, include_css: bool, include_js: bool) -> str:
    """Combine code parts into full HTML document"""
    if not html:
        html = "<!-- No HTML generated -->\n<div></div>"

    has_html_tag = bool(re.search(r"<\s*html", html, re.IGNORECASE))
    has_head = bool(re.search(r"<\s*head", html, re.IGNORECASE))
    has_body = bool(re.search(r"<\s*body", html, re.IGNORECASE))

    final = html

    if not has_html_tag:
        # Wrap in full page structure
        head_content = ""
        if include_css and css:
            head_content += f"\n<style>\n{css}\n</style>\n"
        
        body_content = html
        if include_js and js:
            body_content += f"\n<script>\n{js}\n</script>\n"
        
        final = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Code</title>
    {head_content}
</head>
<body>
    {body_content}
</body>
</html>"""
        return final

    # Inject CSS into head
    if include_css and css:
        if has_head:
            final = re.sub(r"(<\s*head[^>]*>)", r"\1\n<style>\n" + css + "\n</style>\n", final, flags=re.IGNORECASE)
        else:
            final = re.sub(r"(<\s*html[^>]*>)", r"\1\n<head>\n<style>\n" + css + "\n</style>\n</head>\n", final, flags=re.IGNORECASE)

    # Inject JS before </body>
    if include_js and js:
        if has_body:
            final = re.sub(r"(</\s*body\s*>)", "\n<script>\n" + js + "\n</script>\n\\1", final, flags=re.IGNORECASE)
        else:
            final = final + f"\n<script>\n{js}\n</script>\n"

    return final

def generate_modification_summary(request, old_code: str, new_code: str) -> Dict[str, Any]:
    """Generate detailed modification summary"""
    from datetime import datetime
    
    old_lines = len(old_code.split('\n')) if old_code else 0
    new_lines = len(new_code.split('\n')) if new_code else 0
    line_diff = new_lines - old_lines
    
    # Analyze what might have changed
    summary = {
        "action": request.modification_type.value,
        "description": request.prompt[:100] + ("..." if len(request.prompt) > 100 else ""),
        "line_changes": {
            "old": old_lines,
            "new": new_lines,
            "diff": line_diff
        },
        "timestamp": datetime.now().isoformat()
    }
    
    # Detect specific changes
    if "register" in request.prompt.lower():
        summary["changes"] = ["Added registration link or form"]
    
    if "theme" in request.prompt.lower() or "color" in request.prompt.lower():
        summary["changes"] = ["Updated colors and styling"]
    
    if "responsive" in request.prompt.lower():
        summary["changes"] = ["Enhanced responsive design"]
    
    return summary