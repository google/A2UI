"""Welcome to Reflex! This file outlines the steps to create a basic app."""

import reflex as rx

from rxconfig import config
from heartyculturenursery.components.navbar import navbar
from heartyculturenursery.components.hero import hero
from heartyculturenursery.components.product_grid import product_grid
from heartyculturenursery.pages.login import login
from heartyculturenursery.components.plant_cart_drawer import plant_cart_drawer
from heartyculturenursery.components.menu_drawer import menu_drawer
from heartyculturenursery.state import AuthState, CartState, CheckoutState, PlantCartState



class State(rx.State):
    """The app state."""


def index() -> rx.Component:
    # Welcome Page (Index)
    return rx.box(
        # Main Content Wrapper (shifts when cart is open)
        rx.box(
            navbar(),
            rx.vstack(
                hero(),
                product_grid(),
                width="100%",
                flex="1",
            ),
            width="100%",
            margin_right=rx.cond(PlantCartState.is_open, "380px", "0"), # Shift entire page content
            transition="margin-right 0.3s ease-in-out",
        ),
        
        plant_cart_drawer(),
        menu_drawer(),
        width="100%",
        on_mount=PlantCartState.on_load,
    )


app = rx.App()
app.add_page(index, on_load=[AuthState.check_login, PlantCartState.on_load])
app.add_page(login, route="/login")
# Import and register cart/checkout pages
from heartyculturenursery.pages.cart import cart
from heartyculturenursery.pages.checkout import checkout
app.add_page(cart, route="/cart", on_load=PlantCartState.on_load)
app.add_page(checkout, route="/checkout", on_load=[CheckoutState.on_load, PlantCartState.on_load])
from heartyculturenursery.pages.ebooks import ebooks, EbookState
app.add_page(ebooks, route="/ebooks", on_load=EbookState.load_books)
from heartyculturenursery.pages.flowering_shrubs import flowering_shrubs, FloweringShrubsState
app.add_page(flowering_shrubs, route="/plants/flowering-shrubs", on_load=FloweringShrubsState.load_plants)
from heartyculturenursery.pages.plants import plants_page
app.add_page(plants_page, route="/plants")
from heartyculturenursery.pages.draceana_varieties import draceana_varieties, DraceanaState
app.add_page(draceana_varieties, route="/plants/draceana-varieties", on_load=DraceanaState.load_plants)
from heartyculturenursery.pages.cordyline_varieties import cordyline_varieties, CordylineState
app.add_page(cordyline_varieties, route="/plants/cordyline-varieties", on_load=CordylineState.load_plants)
from heartyculturenursery.pages.philodendron_varieties import philodendron_varieties, PhilodendronState
app.add_page(philodendron_varieties, route="/plants/philodendron-varieties", on_load=PhilodendronState.load_plants)
from heartyculturenursery.pages.water_lilies_lotus import water_lilies_lotus, WaterLiliesState
app.add_page(water_lilies_lotus, route="/plants/water-lilies-lotus", on_load=WaterLiliesState.load_plants)
from heartyculturenursery.pages.aquatic_plants import aquatic_plants, AquaticPlantsState
app.add_page(aquatic_plants, route="/plants/aquatic-plants", on_load=AquaticPlantsState.load_plants)
from heartyculturenursery.pages.heliconia_varieties import heliconia_varieties, HeliconiaState
app.add_page(heliconia_varieties, route="/plants/heliconia-varieties", on_load=HeliconiaState.load_plants)
from heartyculturenursery.pages.plumeria_varieties import plumeria_varieties, PlumeriaState
app.add_page(plumeria_varieties, route="/plants/plumeria-varieties", on_load=PlumeriaState.load_plants)
from heartyculturenursery.pages.climbers_creepers import climbers_creepers, ClimbersState
app.add_page(climbers_creepers, route="/plants/climbers-creepers", on_load=ClimbersState.load_plants)
from heartyculturenursery.pages.fruit_varieties import fruit_varieties, FruitState
app.add_page(fruit_varieties, route="/plants/fruit-varieties", on_load=FruitState.load_plants)
from heartyculturenursery.pages.ginger_varieties import ginger_varieties, GingerState
app.add_page(ginger_varieties, route="/plants/ginger-varieties", on_load=GingerState.load_plants)
from heartyculturenursery.pages.calathea_varieties import calathea_varieties, CalatheaState
app.add_page(calathea_varieties, route="/plants/calathea-varieties", on_load=CalatheaState.load_plants)
from heartyculturenursery.pages.ornamental_musa import ornamental_musa, OrnamentalMusaState
app.add_page(ornamental_musa, route="/plants/ornamental-musa", on_load=OrnamentalMusaState.load_plants)
from heartyculturenursery.pages.palm_varieties import palm_varieties, PalmState
app.add_page(palm_varieties, route="/plants/palm-varieties", on_load=PalmState.load_plants)
from heartyculturenursery.pages.herbal_medicinal import herbal_medicinal, HerbalState
app.add_page(herbal_medicinal, route="/plants/herbal-medicinal", on_load=HerbalState.load_plants)
from heartyculturenursery.pages.sacred_trees import sacred_trees, SacredTreesState
app.add_page(sacred_trees, route="/plants/sacred-trees", on_load=SacredTreesState.load_plants)
from heartyculturenursery.pages.tree_species import tree_species, TreeSpeciesState
app.add_page(tree_species, route="/plants/tree-species", on_load=TreeSpeciesState.load_plants)
from heartyculturenursery.pages.coconut_varieties import coconut_varieties, CoconutState
app.add_page(coconut_varieties, route="/plants/coconut-varieties", on_load=CoconutState.load_plants)
from heartyculturenursery.pages.mango_varieties import mango_varieties, MangoState
app.add_page(mango_varieties, route="/plants/mango-varieties", on_load=MangoState.load_plants)
from heartyculturenursery.pages.banana_varieties import banana_varieties, BananaState
app.add_page(banana_varieties, route="/plants/banana-varieties", on_load=BananaState.load_plants)
from heartyculturenursery.pages.commercial_timber import commercial_timber, TimberState
app.add_page(commercial_timber, route="/plants/commercial-timber", on_load=TimberState.load_plants)
