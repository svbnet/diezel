import { Transform } from "stream";

export declare interface ConstantKeys {
    LEGACY_URL_KEY?: string;
    TRACK_XOR_KEY: string;
    MOBILE_GW_KEY?: string;
    MOBILE_API_KEY?: string;
}

export declare interface UserInfo {
    arl: string;
    id: number;
    username?: string;
    email: string;
}

export declare interface DefaultParams {
    baseUrl: string;
    userAgent: string;
    lang: string;
    deviceInfo: {
        os: string;
        name: string;
        type: string;
        model: string;
        platform: string;
        serial: string;
    }
}

export type Id = string | number;
export type AnyEntity = Record<string, unknown>;

export declare enum ArtistSection {
    Masthead = 'MASTHEAD',
    TopTracks = 'TOP_TRACKS',
    Highlights = 'HIGHLIGHT',
    Discography = 'DISCOGRAPHY',
    SimilarArtists = 'SIMILAR_ARTISTS',
    Playlists = 'PLAYLISTS',
    FeaturedIn = 'FEATURED_IN',
}

export declare enum EntitySearchType {
    Album = 'ALBUM',
    Artist = 'ARTIST',
    Track = 'TRACK',
    Playlist = 'PLAYLIST',
    Radio = 'RADIO',
    Show = 'SHOW',
    User = 'USER',
    Livestream = 'LIVESTREAM',
    Channel = 'CHANNEL',
    Episode = 'EPISODE',
}

export declare enum EntityType {
    Album = 'album',
    Artist = 'artist',
    Song = 'song',
    Playlist = 'playlist',
    Radio = 'radio',
    Show = 'show',
    User = 'user',
    Livestream = 'livestream',
    Channel = 'channel',
    Episode = 'episode',
}

export interface TypedEntity<T extends EntityType> extends AnyEntity {
    __TYPE__: T;
}

export interface Song extends TypedEntity<EntityType.Song> {
    SNG_ID: string;
    MD5_ORIGIN: string;
    PUID: string;
    MEDIA_VERSION: string;
}

export declare interface ImageSize {
    width: number;
    height: number;
}

export declare interface ImageUrlOptions {
    baseUrl?: string;
    type?: string;
    id?: string;
    dimensions?: ImageSize,
    backgroundColor?: string;
    quality?: number;
    format?: diezel.content.ImageFormat;
}

export declare namespace diezel {
    const version: string;
    function setKeys(keys: ConstantKeys): void;

    namespace clients {
        class MediaClient {
            getMediaStreamInfo(song: Song, format: content.SongFormat, cipher?: content.SongCipher): content.SongAsset;
        }

        class MobileClient {
            constructor(userInfo?: UserInfo, defaultParams?: DefaultParams);
            initializeKeys(): Promise<void>;
            signedIn: boolean;
            userInfo: UserInfo;
            sid: string;
            mediaClient: MediaClient;
            signInWithEmail(email: string, password: string): Promise<boolean>;
            restoreSession(): Promise<void>;

            getSong(id: Id): Promise<TypedEntity<EntityType.Song>>;
            getSongLyrics(id: Id): Promise<AnyEntity>;
            getAlbum(id: Id): Promise<TypedEntity<EntityType.Album>>;
            getArtistSection(id: Id, sections: Array<ArtistSection>): Promise<AnyEntity>;
            getPlaylistInfo(id: Id): Promise<TypedEntity<EntityType.Playlist>>;
            getPlaylistSongs(id: Id, start?: number, count?: number): Promise<AnyEntity>;
            getSearchSuggestions(query: string, types?: Array<EntityType>, count?: number): Promise<AnyEntity>;
            getSearchResults(query: string, type: EntitySearchType, start?: number, count?: number): Promise<AnyEntity>;
            getFavoriteAlbums(userId: Id, count?: number): Promise<AnyEntity>;
            getFavoriteArtists(userId: Id, count?: number): Promise<AnyEntity>;
            getFavoritePlaylists(userId: Id, count?: number): Promise<AnyEntity>;
            getUserPlaylists(userId: Id, count?: number): Promise<AnyEntity>;
        }
    }

    namespace content {
        enum ImageFormat {
            PNG = 'png',
            JPEG = 'jpg',
        }

        enum SongCipher {
            NONE = 'NONE',
            BF_CBC_STRIPE = 'BF_CBC_STRIPE'
        }

        enum SongFormat {
            AAC_64 = "AAC_64",
            AAC_96 = "AAC_96",
            FLAC = "FLAC",
            MP3_MISC = "MP3_MISC",
            MP3_32 = "MP3_32",
            MP3_64 = "MP3_64",
            MP3_128 = "MP3_128",
            MP3_192 = "MP3_192",
            MP3_256 = "MP3_256",
            MP3_320 = "MP3_320",
            SBC_256 = "SBC_256"
        }

        enum SongLegacyFormat {
            MP3_MISC = 0,
            MP3_128 = 1,
            MP3_320 = 3,
            MP3_256 = 5,
            AAC_64 = 6,
            MP3_192 = 7,
            AAC_96 = 8,
            FLAC = 9,
            MP3_64 = 10,
            MP3_32 = 11,
            SBC = 12,
            MP4_RA1 = 13,
            MP4_RA2 = 14,
            MP4_RA3 = 15,
        }

        class ImageUrl {
            static readonly MAX_SIZE: ImageSize;
            static readonly BASE_URL: string;
            constructor(options?: ImageUrlOptions);
            forObject<T extends EntityType>(object: TypedEntity<T>): this;
            toString(options?: ImageUrlOptions): string;
        }

        class SongAsset {
            private constructor();
            static forLegacyStream(song: Song, format: SongLegacyFormat): SongAsset;
            createTransformer(): Transform;
            getDecryptedStream(): Promise<Transform>;
        }
    }

    namespace errors {
        class DiezelError extends Error { }
        class MediaClientError extends DiezelError { }
        class StateError extends DiezelError { }
        class GatewayError extends DiezelError {
            errors: any;
        }
    }
}