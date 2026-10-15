-- Sample catalog, same ids as the old src/data files. Safe to run again.
-- Run with `supabase db push --include-seed` (remote) or `supabase db reset` (local).

insert into public.airports (code, city, country_code) values
  ('TUN', 'Tunis', 'TN'),
  ('CDG', 'Paris', 'FR'),
  ('BCN', 'Barcelona', 'ES'),
  ('FCO', 'Rome', 'IT'),
  ('LHR', 'London', 'GB'),
  ('JFK', 'New York', 'US')
on conflict (code) do nothing;

-- depart_date and return_date are filled by private.roll_sample_dates() at the end.
insert into public.flights
  (id, origin_code, destination_code, depart_date, airline, price, duration_minutes, stops, sample_depart_offset, sample_return_offset)
values
  ('flight-tun-bcn-1', 'TUN', 'BCN', current_date, 'Tunisair', 76, 115, 0, 25, null),
  ('flight-tun-cdg-1', 'TUN', 'CDG', current_date, 'Air France', 214, 135, 0, 20, 23),
  ('flight-cdg-fco-1', 'CDG', 'FCO', current_date, 'ITA Airways', 89, 130, 1, 34, null),
  ('flight-lhr-jfk-1', 'LHR', 'JFK', current_date, 'British Airways', 480, 470, 0, 45, 52),
  ('flight-bcn-fco-1', 'BCN', 'FCO', current_date, 'Vueling', 58, 105, 0, 39, null),
  ('flight-tun-fco-1', 'TUN', 'FCO', current_date, 'Nouvelair', 142, 100, 0, 28, 32),
  ('flight-tun-cdg-2', 'TUN', 'CDG', current_date, 'Transavia', 97, 140, 0, 41, null),
  ('flight-tun-lhr-1', 'TUN', 'LHR', current_date, 'Tunisair', 289, 215, 0, 30, 37),
  ('flight-tun-jfk-1', 'TUN', 'JFK', current_date, 'Turkish Airlines', 536, 780, 1, 55, null),
  ('flight-cdg-bcn-1', 'CDG', 'BCN', current_date, 'Vueling', 119, 125, 0, 24, 27),
  ('flight-lhr-cdg-1', 'LHR', 'CDG', current_date, 'easyJet', 64, 80, 0, 36, null),
  ('flight-fco-tun-1', 'FCO', 'TUN', current_date, 'ITA Airways', 92, 105, 0, 50, null)
on conflict (id) do nothing;

insert into public.hotels
  (id, name, city, country, neighborhood, star_rating, review_score, review_count, price_per_night, currency)
values
  ('hotel-riad-dar-zaman', 'Riad Dar Zaman', 'Tunis', 'Tunisia', 'Medina', 4, 4.8, 312, 54, 'EUR'),
  ('hotel-grands-boulevards', 'Hôtel des Grands Boulevards', 'Paris', 'France', 'Le Marais', 4, 4.6, 218, 89, 'EUR'),
  ('hotel-z-piccadilly', 'The Z Hotel Piccadilly', 'London', 'United Kingdom', 'Piccadilly Circus', 3, 4.3, 540, 120, 'GBP'),
  ('hotel-artemide', 'Hotel Artemide', 'Rome', 'Italy', 'Via Nazionale', 4, 4.5, 1024, 135, 'EUR'),
  ('hotel-casa-camper', 'Hotel Casa Camper', 'Barcelona', 'Spain', 'El Raval', 4, 4.7, 389, 98, 'EUR')
on conflict (id) do nothing;

insert into public.car_rentals (id, company, car_type, pickup_city, price_per_day, currency) values
  ('car-hertz-tunis', 'Hertz', 'Economy', 'Tunis', 28, 'EUR'),
  ('car-europcar-paris', 'Europcar', 'Compact', 'Paris', 35, 'EUR'),
  ('car-avis-rome', 'Avis', 'SUV', 'Rome', 52, 'EUR'),
  ('car-sixt-barcelona', 'Sixt', 'Economy', 'Barcelona', 31, 'EUR')
on conflict (id) do nothing;

insert into public.destinations (id, city, country, blurb, rating, image_url, airport_code) values
  ('destination-paris', 'Paris', 'France', 'Cafés, the Seine, and world-class museums.', 4.8,
   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop', 'CDG'),
  ('destination-barcelona', 'Barcelona', 'Spain', 'Gaudí architecture, tapas, and beach afternoons.', 4.7,
   'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80&auto=format&fit=crop', 'BCN'),
  ('destination-rome', 'Rome', 'Italy', 'Ancient ruins, pasta, and golden-hour piazzas.', 4.9,
   'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80&auto=format&fit=crop', 'FCO'),
  ('destination-london', 'London', 'United Kingdom', 'Markets, theatre, and a river full of history.', 4.6,
   'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80&auto=format&fit=crop', 'LHR')
on conflict (id) do nothing;

insert into public.deals (id, type, title, subtitle, image_url, featured, flight_id, hotel_id, car_id) values
  ('deal-tunis-paris', 'flight', 'Tunis to Paris', 'Air France · round trip',
   'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&auto=format&fit=crop', true, 'flight-tun-cdg-1', null, null),
  ('deal-barcelona-rome-hop', 'flight', 'Barcelona to Rome', 'Vueling · direct',
   'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80&auto=format&fit=crop', false, 'flight-bcn-fco-1', null, null),
  ('deal-tunis-medina-stay', 'hotel', 'Stay in the Medina', 'Riad Dar Zaman, Tunis',
   'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80&auto=format&fit=crop', true, null, 'hotel-riad-dar-zaman', null),
  ('deal-rome-artemide-stay', 'hotel', 'Hotel Artemide, Rome', '4★ · Via Nazionale',
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop', false, null, 'hotel-artemide', null),
  ('deal-rome-weekend-wheels', 'car', 'Weekend wheels in Rome', 'Avis SUV rental',
   'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop', true, null, null, 'car-avis-rome'),
  ('deal-barcelona-city-wheels', 'car', 'City wheels in Barcelona', 'Sixt · economy',
   'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80&auto=format&fit=crop', false, null, null, 'car-sixt-barcelona')
on conflict (id) do nothing;

-- Last: set the real dates from the offsets.
select private.roll_sample_dates();
