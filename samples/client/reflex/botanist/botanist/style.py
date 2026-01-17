# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Styling for the Digital Botanist Reflex client."""

# Color palette - green theme matching existing botanist clients
COLORS = {
    "p_20": "#1b5e20",  # Dark green
    "p_25": "#2e7d32",  # Medium dark green
    "p_30": "#388e3c",  # Primary green
    "p_40": "#43a047",  # Light green
    "p_50": "#66bb6a",  # Lighter green
    "p_60": "#81c784",  # Even lighter
    "p_70": "#a5d6a7",  # Very light green
    "p_90": "#c8e6c9",  # Pale green
    "p_95": "#e8f5e9",  # Almost white green
    "e_40": "#d32f2f",  # Error red
    "e_80": "#ffcdd2",  # Light error
    "e_90": "#ffebee",  # Pale error
    "white": "#ffffff",
    "gray_100": "#f5f5f5",
    "gray_600": "#757575",
}

# Common styles
container_style = {
    "max_width": "800px",
    "margin": "0 auto",
    "min_height": "100vh",
    "padding": "0 16px",
    "font_family": "'Segoe UI', 'Roboto', sans-serif",
}

header_style = {
    "display": "flex",
    "align_items": "center",
    "gap": "12px",
    "padding": "24px 0 16px",
    "border_bottom": f"1px solid {COLORS['p_90']}",
    "margin_bottom": "16px",
}

logo_style = {
    "font_size": "48px",
}

title_style = {
    "margin": "0",
    "font_size": "28px",
    "font_weight": "700",
    "color": COLORS["p_30"],
}

subtitle_style = {
    "margin": "0",
    "font_size": "14px",
    "color": COLORS["p_40"],
}

search_form_style = {
    "display": "flex",
    "flex_direction": "column",
    "gap": "16px",
    "padding": "16px 0",
}

search_row_style = {
    "display": "flex",
    "gap": "12px",
    "align_items": "center",
    "width": "100%",
}

search_input_style = {
    "flex": "1",
    "border_radius": "28px",
    "padding": "14px 24px",
    "border": f"2px solid {COLORS['p_70']}",
    "font_size": "16px",
    "background": COLORS["white"],
    "outline": "none",
    "_focus": {
        "border_color": COLORS["p_40"],
        "box_shadow": f"0 0 0 4px rgba(46, 125, 50, 0.15)",
    },
}

search_button_style = {
    "display": "flex",
    "align_items": "center",
    "justify_content": "center",
    "background": COLORS["p_30"],
    "color": COLORS["white"],
    "border": "none",
    "padding": "14px 24px",
    "border_radius": "28px",
    "font_weight": "600",
    "gap": "8px",
    "cursor": "pointer",
    "transition": "background 0.2s, transform 0.1s",
    "_hover": {
        "background": COLORS["p_25"],
    },
    "_disabled": {
        "opacity": "0.5",
        "cursor": "not-allowed",
    },
}

quick_actions_style = {
    "display": "flex",
    "flex_wrap": "wrap",
    "gap": "8px",
}

quick_action_button_style = {
    "padding": "8px 16px",
    "border_radius": "20px",
    "border": f"1px solid {COLORS['p_60']}",
    "background": COLORS["white"],
    "color": COLORS["p_30"],
    "font_size": "13px",
    "cursor": "pointer",
    "transition": "all 0.2s",
    "_hover": {
        "background": COLORS["p_95"],
        "border_color": COLORS["p_40"],
    },
}

pending_style = {
    "width": "100%",
    "min_height": "200px",
    "display": "flex",
    "flex_direction": "column",
    "align_items": "center",
    "justify_content": "center",
    "gap": "12px",
    "color": COLORS["p_40"],
}

spinner_style = {
    "font_size": "32px",
    "color": COLORS["p_50"],
    "animation": "spin 1s linear infinite",
}

error_style = {
    "color": COLORS["e_40"],
    "background": COLORS["e_90"],
    "border": f"1px solid {COLORS['e_80']}",
    "padding": "16px",
    "border_radius": "12px",
    "margin": "16px 0",
}

back_button_style = {
    "display": "inline-flex",
    "align_items": "center",
    "gap": "8px",
    "padding": "8px 16px",
    "margin_bottom": "16px",
    "border_radius": "20px",
    "border": f"1px solid {COLORS['p_60']}",
    "background": COLORS["white"],
    "color": COLORS["p_30"],
    "font_size": "14px",
    "cursor": "pointer",
    "transition": "all 0.2s",
    "_hover": {
        "background": COLORS["p_95"],
    },
}

surfaces_style = {
    "display": "flex",
    "flex_direction": "column",
    "width": "100%",
    "padding": "12px 0",
    "gap": "16px",
}

# A2UI Component Styles
card_style = {
    "background": COLORS["white"],
    "border_radius": "16px",
    "box_shadow": "0 4px 12px rgba(46, 125, 50, 0.15)",
    "overflow": "hidden",
    "margin_bottom": "16px",
    "transition": "transform 0.2s, box_shadow 0.2s",
    "_hover": {
        "transform": "translateY(-2px)",
        "box_shadow": "0 6px 16px rgba(46, 125, 50, 0.2)",
    },
}

card_row_style = {
    "display": "grid",
    "grid_template_columns": "150px 1fr auto",
    "gap": "16px",
    "align_items": "center",
    "padding": "12px",
}

card_image_style = {
    "width": "150px",
    "height": "120px",
    "border_radius": "12px",
    "overflow": "hidden",
    "object_fit": "cover",
}

card_column_style = {
    "display": "flex",
    "flex_direction": "column",
    "gap": "4px",
    "min_width": "0",
}

card_title_style = {
    "font_weight": "600",
    "color": COLORS["p_20"],
    "font_size": "16px",
    "margin": "0",
}

card_subtitle_style = {
    "font_style": "italic",
    "color": COLORS["p_40"],
    "font_size": "14px",
    "margin": "0",
}

card_text_style = {
    "color": COLORS["gray_600"],
    "font_size": "14px",
    "margin": "0",
}

card_button_style = {
    "background": COLORS["p_30"],
    "color": COLORS["white"],
    "border": "none",
    "padding": "8px 16px",
    "border_radius": "20px",
    "font_weight": "600",
    "cursor": "pointer",
    "transition": "background 0.2s",
    "_hover": {
        "background": COLORS["p_20"],
    },
}

list_style = {
    "display": "flex",
    "flex_direction": "column",
    "gap": "12px",
}

row_style = {
    "display": "flex",
    "flex_direction": "row",
    "gap": "12px",
    "align_items": "center",
}

column_style = {
    "display": "flex",
    "flex_direction": "column",
    "gap": "8px",
}

text_style = {
    "margin": "0",
    "color": COLORS["gray_600"],
}

heading_style = {
    "margin": "0",
    "color": COLORS["p_30"],
    "font_weight": "600",
}

image_style = {
    "max_width": "100%",
    "border_radius": "8px",
}
