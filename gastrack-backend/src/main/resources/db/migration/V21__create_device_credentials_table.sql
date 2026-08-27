CREATE SEQUENCE IF NOT EXISTS device_credential_id_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE device_credentials (
    id              BIGINT       NOT NULL DEFAULT nextval('device_credential_id_seq'),
    equipment_id    BIGINT       NOT NULL,
    thing_name      VARCHAR(128) NOT NULL,
    certificate_id  VARCHAR(128) NOT NULL,
    certificate_pem TEXT         NOT NULL,
    private_key     TEXT         NOT NULL,
    public_key      TEXT         NOT NULL,
    iot_endpoint    VARCHAR(255) NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_device_credentials_equipment UNIQUE (equipment_id),
    CONSTRAINT uk_device_credentials_thing     UNIQUE (thing_name),
    CONSTRAINT fk_device_credentials_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);
