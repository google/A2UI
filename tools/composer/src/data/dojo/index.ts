// Curated v0.8 scenarios — verified working, distinct, showcase-worthy
import restaurantBooking from './restaurant-booking.json';
import restaurantList from './restaurant-list.json';
import restaurantFinder from './restaurant-finder.json';
import contactCard from './contact-card.json';
import contactList from './contact-list.json';
import contactLookup from './contact-lookup.json';
import floorPlan from './floor-plan.json';

export const scenarios = {
  'restaurant-finder': restaurantFinder,
  'restaurant-booking': restaurantBooking,
  'restaurant-list': restaurantList,
  'contact-lookup': contactLookup,
  'contact-card': contactCard,
  'contact-list': contactList,
  'floor-plan': floorPlan,
};

export type ScenarioId = keyof typeof scenarios;
