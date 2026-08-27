package com.gastrack;

import com.gastrack.model.City;
import com.gastrack.model.Country;
import com.gastrack.model.State;
import com.gastrack.repository.CityRepository;
import com.gastrack.repository.CountryRepository;
import com.gastrack.repository.StateRepository;
import org.springframework.stereotype.Component;

@Component
public class TestDataFactory {

    private final CountryRepository countryRepository;
    private final StateRepository stateRepository;
    private final CityRepository cityRepository;

    public TestDataFactory(
            CountryRepository countryRepository,
            StateRepository stateRepository,
            CityRepository cityRepository
    ) {
        this.countryRepository = countryRepository;
        this.stateRepository = stateRepository;
        this.cityRepository = cityRepository;
    }

    public City getOrCreateSaoPauloCity() {
        return cityRepository.findByCode("3550308")
            .orElseGet(this::createSaoPauloCity);
    }

    public City getOrCreateRioDeJaneiroCity() {
        return cityRepository.findByCode("3304557")
            .orElseGet(this::createRioDeJaneiroCity);
    }

    private City createSaoPauloCity() {
        Country country = getOrCreateBrazil();
        State state = getOrCreateSaoPauloState(country);

        return cityRepository.save(City.builder()
            .name("São Paulo")
            .code("3550308")
            .state(state)
            .active(true)
            .build());
    }

    private City createRioDeJaneiroCity() {
        Country country = getOrCreateBrazil();
        State state = getOrCreateRioDeJaneiroState(country);

        return cityRepository.save(City.builder()
            .name("Rio de Janeiro")
            .code("3304557")
            .state(state)
            .active(true)
            .build());
    }

    private Country getOrCreateBrazil() {
        return countryRepository.findByCode("BR")
            .orElseGet(() -> countryRepository.save(Country.builder()
                .name("Brasil")
                .code("BR")
                .active(true)
                .build()));
    }

    private State getOrCreateSaoPauloState(Country country) {
        return stateRepository.findByCode("35")
            .orElseGet(() -> stateRepository.save(State.builder()
                .name("São Paulo")
                .code("35")
                .abbreviation("SP")
                .country(country)
                .active(true)
                .build()));
    }

    private State getOrCreateRioDeJaneiroState(Country country) {
        return stateRepository.findByCode("33")
            .orElseGet(() -> stateRepository.save(State.builder()
                .name("Rio de Janeiro")
                .code("33")
                .abbreviation("RJ")
                .country(country)
                .active(true)
                .build()));
    }
}
