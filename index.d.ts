declare module "file-essentials" {
    import { Stats } from "fs";
    import { Readable } from "stream";

    /**
     * Recursively creates subfolder in context of selected base folder.
     *
     * Base folder is created as such, if missing. Selected subfolder is created
     * segment by segment, if missing.
     *
     * @param baseFolder path name of base
     * @param subFolder relative path name of subfolder to create segment by segment
     * @returns promise providing full pathname of resulting folder
     */
    export function mkdir( baseFolder: string, subFolder?: string ): Promise<string>;

    /**
     * Recursively creates subfolder in context of selected base folder.
     *
     * Base folder is created as such, if missing. Selected subfolder is created
     * segment by segment, if missing.
     *
     * @param baseFolder path name of base
     * @param subFolderSegments relative path name of subfolder provided as list of its segments
     * @returns promise providing full pathname of resulting folder
     */
    export function mkdir( baseFolder: string, subFolderSegments?: string[] ): Promise<string>;

    /** @borrows mkdir */
    export function MkDir( baseFolder: string, subFolder?: string ): Promise<string>;

    /** @borrows mkdir */
    export function MkDir( baseFolder: string, subFolderSegments?: string[] ): Promise<string>;


    type MkFilePathQualifierCallback = ( string ) => string[];

    interface MkFileOptions {
        /** Custom suffix to append to resulting file's name. [default: none] */
        suffix?: string;
        /** Limits number of attempts for picking non-conflicting random UUID. [default: 20] */
        maxAttempts?: number;
        /** Custom callback for mapping a UUID into segments of resulting file's relative pathname. */
        uuidToPath?: MkFilePathQualifierCallback;
    }

    interface MkFileResult {
        /** File descriptor of opened file. */
        fd: number;
        /** Full pathname of opened file. */
        name: string;
        /** Random UUID used for deriving opened file's name. */
        uuid: string;
    }

    /**
     * Opens new file w/ random UUIDv4 as name for reading/writing.
     *
     * The file is put into a subfolder of provided folder deriving subfolder's
     * name from used UUID. This is used to prevent huge amounts of files in a
     * single folder probably affecting filesystem's performance.
     *
     * The opened file is readable and writable by current user, only. By instantly
     * trying to open file requiring its creation any chance of a race condition
     * is _limited_.
     *
     * This implementation tries to work as non-blocking as possible and thus
     * returns a promise. Aside from that it is designed to use as little stack
     * frames as possible for optimal performance.
     *
     * @param folder path name of folder to contain temporary file
     * @param options behaviour customizations
     * @returns promise for file descriptor, picked UUID and derived pathname of open file
     */
    export function mkfile( folder: string, options?: MkFileOptions ): Promise<MkFileResult>;

    /** @borrows mkfile */
    export function MkFile( folder: string, options?: MkFileOptions ): Promise<MkFileResult>;


    interface ListOptions {
        /** Controls whether exclude hidden files from resulting list. [default: true] */
        noHidden?: boolean;
    }

    /**
     * Lists elements directly subordinated to a given folder.
     *
     * @param pathname path name of folder to be enumerated [default: .]
     * @param options behaviour customizations
     * @returns promises filenames of elements in folder
     */
    export function list( pathname?: string, options?: ListOptions ): Promise<string[]>;

    /** @borrows list */
    export function List( pathname?: string, options?: ListOptions ): Promise<string[]>;


    /**
     * Provides context shared by any invocation of filter callback and converter
     * callback during enumerating elements of a given folder.
     */
    interface IterationContext {
        /** Callback to be invoked for stop enumeration prematurely. */
        cancel();
    }

    type FindFilterCallback = ( this: IterationContext, localPath: string, fullPath: string, stat: Stats, depth: number ) => boolean;
    type FindConverterCallback = ( this: IterationContext, localPath: string, fullPath: string, stat: Stats, depth: number ) => any;

    interface FindOptions {
        /** Custom callback deciding whether obeying some element on enumeration of elements. [default: obey all elements] */
        filter?: FindFilterCallback;
        /** Custom callback mapping element's pathname into whatever is listed in result. [default: use local pathname of file] */
        converter?: FindConverterCallback;
        /** Controls whether descending into subfolders before enumerating further elements of current folder. [default: false] */
        depthFirst?: boolean;
        /** Controls whether retrieving matching elements' full pathname instead of local one. [default: false, ignored when using converter] */
        qualified?: boolean;
        /** Minimum number of hierarchy levels to descend into before obeying any element. [default: 0] */
        minDepth?: number;
        /** Maximum number of hierarchy levels to obey. [default: Infinity] */
        maxDepth?: number;
        /** Controls whether omit provided base element in result or not. [default: true] */
        skipFilteredFolder?: boolean;
        /** Controls whether returning stream of elements instead of promising array of elements as result. [default: false] */
        stream?: boolean;
        /** Controls whether invoking filter callback on provided base element, too. [default: false] */
        filterSelf?: boolean;
        /** Controls whether waiting for converter callback returning promise instead of collecting those for result. [default: false] */
        waitForConverter?: boolean;
    }

    type FindResult = Promise<string[] | Array<any>> | Readable;

    /**
     * Deeply enumerates provided folder for containing files' names.
     *
     * @param pathname base folder for starting enumeration
     * @param options behaviour customizations
     * @returns {FindResult} promise for path names of matching files and folders or provides them in a stream
     */
    export function find( pathname: string, options: FindOptions ): FindResult;

    /** @borrows find */
    export function Find( pathname: string, options: FindOptions ): FindResult;


    interface RmDirOptions {
        /** Controls whether removing all elements in folder but keep selected folder itself or not. [default: false] */
         subsOnly?: boolean;
    }

    /**
     * Recursively removes a folder all contained elements.
     *
     * @note This method detects if pathname is not selecting directory but some
     *       file and removes it nonetheless.
     *
     * @param pathname pathname of element to remove
     * @param options behaviour customizations
     * @returns promise for pathnames of successfully removed files and folders as selected
     */
    export function rmdir( pathname: string, options?: RmDirOptions ): Promise<string[]>;

    /** @borrows rmdir */
    export function RmDir( pathname: string, options?: RmDirOptions ): Promise<string[]>;


    /**
     * Reads content of selected file.
     *
     * @param pathname pathname of file to read
     * @returns promise for read content of file
     */
    export function read( pathname: string ): Promise<Buffer>;

    /** @borrows read */
    export function Read( pathname: string ): Promise<Buffer>;


    /**
     * Writes content to selected file.
     *
     * @param pathname pathname of file to write
     * @param content content to be written to file
     * @returns promise for content written to file
     */
    export function write( pathname: string, content: ( Buffer | string ) ): Promise<Buffer | string>;

    /** @borrows write */
    export function Write( pathname: string, content: ( Buffer | string ) ): Promise<Buffer | string>;


    /**
     * Removes selected file.
     *
     * In opposition to rmdir() this function is much simpler and thus does not
     * support removal of folders.
     *
     * @param pathname pathname of file to remove
     * @returns promise for pathname of removed file as given
     */
    export function remove( pathname: string ): Promise<string>;

    /** @borrows remove */
    export function Remove( pathname: string ): Promise<string>;


    /**
     * Fetches information on selected element.
     *
     * @param pathname pathname of element to inspect
     * @returns promise for information on selected element
     */
    export function stat( pathname: string ): Promise<Stats>;

    /** @borrows stat */
    export function Stat( pathname: string ): Promise<Stats>;
}

