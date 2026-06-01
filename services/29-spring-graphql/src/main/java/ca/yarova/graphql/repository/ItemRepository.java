package ca.yarova.graphql.repository;

import ca.yarova.graphql.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {

    List<Item> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
