package com.civicos.core;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PersistenceConfigurationTest {

    @Autowired
    private Environment environment;

    @Test
    void shouldUseFileBasedH2DatabaseAndUpdateDdlMode() {
        String datasourceUrl = environment.getProperty("spring.datasource.url");
        String ddlAuto = environment.getProperty("spring.jpa.hibernate.ddl-auto");

        assertThat(datasourceUrl).contains("jdbc:h2:file:");
        assertThat(ddlAuto).isEqualTo("update");
    }
}
