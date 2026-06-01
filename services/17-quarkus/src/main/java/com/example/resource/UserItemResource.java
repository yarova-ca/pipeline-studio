package com.example.resource;

import com.example.entity.Item;
import com.example.entity.User;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Map;
import java.util.UUID;

@Path("/users/me/items")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("**")
public class UserItemResource {

    @Inject
    JsonWebToken jwt;

    /** GET /users/me/items — list all items for current user. */
    @GET
    public Response listItems() {
        UUID userId = UUID.fromString(jwt.getSubject());
        return Response.ok(Item.findByUserId(userId)).build();
    }

    /** POST /users/me/items — create an item. */
    @POST
    @Transactional
    public Response createItem(Map<String, String> body) {
        String title = body.get("title");
        if (title == null || title.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "title is required")).build();
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        User user = User.findById(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "User not found")).build();
        }

        Item item = new Item();
        item.title = title;
        item.description = body.get("description");
        item.user = user;
        item.persist();

        return Response.status(Response.Status.CREATED).entity(item).build();
    }

    /** GET /users/me/items/{id} — get one item. */
    @GET
    @Path("/{id}")
    public Response getItem(@PathParam("id") UUID id) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Item item = Item.findByIdAndUserId(id, userId);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Item not found")).build();
        }
        return Response.ok(item).build();
    }

    /** PUT /users/me/items/{id} — update an item. */
    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateItem(@PathParam("id") UUID id, Map<String, String> body) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Item item = Item.findByIdAndUserId(id, userId);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Item not found")).build();
        }

        String title = body.get("title");
        if (title != null && !title.isBlank()) item.title = title;
        if (body.containsKey("description")) item.description = body.get("description");

        return Response.ok(item).build();
    }

    /** DELETE /users/me/items/{id} — delete an item. */
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deleteItem(@PathParam("id") UUID id) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Item item = Item.findByIdAndUserId(id, userId);
        if (item == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Item not found")).build();
        }
        item.delete();
        return Response.noContent().build();
    }
}
