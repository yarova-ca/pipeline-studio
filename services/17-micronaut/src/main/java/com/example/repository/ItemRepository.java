package com.example.repository;

import com.example.entity.Item;
import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@JdbcRepository(dialect = Dialect.POSTGRES)
public interface ItemRepository extends CrudRepository<Item, UUID> {

    List<Item> findByUserId(UUID userId);

    Optional<Item> findByIdAndUserId(UUID id, UUID userId);
}
