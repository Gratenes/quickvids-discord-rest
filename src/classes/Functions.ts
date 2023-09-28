import {
    RESTPostAPICurrentUserCreateDMChannelResult,
    RESTPostAPIChannelMessageJSONBody,
    RESTPatchAPIChannelMessageResult,
    RESTPostAPIChannelMessageResult,
    RESTGetAPIGuildChannelsResult,
    RESTGetAPIChannelResult,
    RESTGetAPIGuildResult,
    PermissionFlagsBits,
    RESTPatchAPIInteractionFollowupJSONBody,
} from "discord-api-types/v9";

import { RESTGetAPIApplicationEntitlementsResult } from "../types/premium";
import type Command from "./Command";
import type Context from "./Context";

export type Permission =
    | keyof typeof PermissionFlagsBits
    | (typeof PermissionFlagsBits)[keyof typeof PermissionFlagsBits];

// bad design with side effect & return type
export function checkPerms(command: Command, ctx: Context) {
    if (!ctx.member) return true;
    const required = command.perms
        .map((perm) =>
            typeof perm === "bigint" ? perm : PermissionFlagsBits[perm]
        )
        .reduce((a, c) => a | c, 0n);
    const missing = required & ~BigInt(ctx.member.permissions);
    const missingNames = Object.keys(PermissionFlagsBits).filter(
        (key) =>
            PermissionFlagsBits[key as keyof typeof PermissionFlagsBits] &
            missing
    );
    if (missing) {
        ctx.reply({
            embeds: [
                {
                    title: "Missing Permissions",
                    description: `You are missing the following permissions: ${missingNames
                        .map((name) => `\`${name}\``)
                        .join(", ")}`,
                    color: 0xff0000,
                },
            ],
            flags: 1 << 6,
        });
        return false;
    }
    return true;
}

export function hasPermission(permission: Permission, permissions?: string) {
    if (!permissions) return true;
    const required =
        typeof permission === "bigint"
            ? permission
            : PermissionFlagsBits[permission];
    const missing = required & ~BigInt(permissions);
    return !missing;
}

export function userTag({
    username,
    discriminator,
}: {
    username: string;
    discriminator: string;
}) {
    return discriminator === "0" ? username : `${username}#${discriminator}`;
}

export function avatarURL({
    id,
    avatar,
    discriminator,
}: {
    id: string;
    avatar: string | null;
    discriminator: string;
}) {
    return (
        "https://cdn.discordapp.com/" +
        (avatar
            ? `avatars/${id}/${avatar}.${
                  avatar.startsWith("_a") ? "gif" : "png"
              }`
            : `/embed/avatars/${Number(discriminator) % 5}.png`)
    );
}

export function deepEquals(
    obj1: any,
    obj2: any,
    ignoreList: string[] = []
): boolean {
    return (
        typeof obj1 === typeof obj2 &&
        Array.isArray(obj1) === Array.isArray(obj2) &&
        (obj1 !== null && typeof obj1 === "object"
            ? Array.isArray(obj1)
                ? obj1.length === obj2.length &&
                  obj1.every((a, i) => deepEquals(a, obj2[i], ignoreList))
                : Object.keys(obj1).every((key) => {
                      return (
                          ignoreList.includes(key) ||
                          (key in obj2 &&
                              deepEquals(obj1[key], obj2[key], ignoreList))
                      );
                  })
            : obj1 === obj2)
    );
}

export function deepCopy<T>(obj: T): T {
    return (
        Array.isArray(obj)
            ? obj.map((a) => deepCopy(a))
            : typeof obj === "object" && obj !== null
            ? Object.fromEntries(
                  Object.entries(obj).map(([k, v]) => [k, deepCopy(v)])
              )
            : obj
    ) as T;
}

export function titleCase(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export async function sendMessage(
    data: RESTPostAPIChannelMessageJSONBody,
    channelId: string,
    token: string
): Promise<RESTPostAPIChannelMessageResult | null> {
    return await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
            headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        }
    ).then((res) => res.json());
}

export async function editMessage(
    data: RESTPostAPIChannelMessageJSONBody,
    channelId: string,
    messageId: string,
    token: string
): Promise<RESTPatchAPIChannelMessageResult | null> {
    return await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
        {
            headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        }
    ).then((res) => res.json());
}

export async function editInteractionResponse(
    data: RESTPatchAPIInteractionFollowupJSONBody,
    applicationId: string,
    interactionToken: string,
    messageId: string
): Promise<RESTPatchAPIChannelMessageResult | null> {
    return await fetch(
        `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/${messageId}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    ).then((res) => res.json());
}

export async function createDMChannel(
    userId: string,
    token: string
): Promise<RESTPostAPICurrentUserCreateDMChannelResult | null> {
    const response = await fetch(
        `${
            process.env.DISCORD_API_URL || "https://discord.com"
        }/api/users/@me/channels`,
        {
            method: "POST",
            headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipient_id: userId }),
        }
    );

    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}

export async function fetchGuild(
    guildId: string,
    token: string
): Promise<RESTGetAPIGuildResult | null> {
    const response = await fetch(
        `${
            process.env.DISCORD_API_URL || "https://discord.com"
        }/api/guilds/${guildId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bot ${token}`,
            },
        }
    );

    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}

export async function fetchChannel(
    channelId: string,
    token: string
): Promise<RESTGetAPIChannelResult | null> {
    const response = await fetch(
        `${
            process.env.DISCORD_API_URL || "https://discord.com"
        }/api/channels/${channelId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bot ${token}`,
            },
        }
    );

    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}

export async function fetchGuildChannels(
    guildId: string,
    token: string
): Promise<RESTGetAPIGuildChannelsResult | null> {
    const response = await fetch(
        `${
            process.env.DISCORD_API_URL || "https://discord.com"
        }/api/guilds/${guildId}/channels`,
        {
            method: "GET",
            headers: {
                Authorization: `Bot ${token}`,
            },
        }
    );

    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}

export async function fetchApplicationEntitlements(
    guildId?: string,
    excludeEnded = true
): Promise<RESTGetAPIApplicationEntitlementsResult | null> {
    const response = await fetch(
        `${
            process.env.DISCORD_API_URL || "https://discord.com"
        }/api/applications/${process.env.APPLICATION_ID}/entitlements?${
            guildId ? `guild_id=${guildId}&` : ""
        }exclude_ended=${excludeEnded}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bot ${process.env.TOKEN}`,
            },
        }
    );

    if (response.ok) {
        return await response.json();
    } else {
        return null;
    }
}