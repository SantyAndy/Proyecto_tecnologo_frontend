import type { Attributes } from "./helpers";
/**
 * Copies a set of attributes off the host element so they can be applied to an element
 * inside the shadow root, then keeps that copy in sync as the host attributes change.
 * Using `inheritAttributes` alone copies once at load, so anything written to the host
 * afterwards never reaches the element the assistive technology reads.
 *
 * Create the controller in `componentWillLoad`. It takes the initial copy and starts
 * watching right away, so `init()` is only needed to resume after a move.
 *
 * Two things to know before adopting it. Only the initial copy removes the attributes
 * from the host, so a value written after load sits on the host as well as on the
 * element it is applied to, which matters if the host has a role of its own. And an
 * attribute from the initial markup can never be removed, only overwritten, since the
 * copy already took it off the host and a `removeAttribute` there fires no mutation.
 * An empty string works for `aria-label` and friends, but a token-valued attribute
 * has to be set to its default instead, so `aria-pressed="false"` rather than empty.
 *
 * @internal
 * @param el The host element to copy from and watch.
 * @param attributes The attributes to copy and watch.
 * @param onChange Called after `attributes` changes, so the component can re-render.
 * @param hostOwnedAttributes Attributes copied at load but not watched. Use it for
 * attributes the component renders on its own `<Host>`, since a later change to one of
 * those is the component's own write, and for attributes that would put a second node in
 * the accessibility tree if the host kept a copy alongside the one we apply.
 */
export declare const createAttributeController: (el: HTMLElement, attributes: string[], onChange: () => void, hostOwnedAttributes?: string[]) => AttributeController;
/**
 * The `createAttributeController` equivalent of `inheritAriaAttributes`, which copies and
 * watches every ARIA attribute plus `role`.
 *
 * @internal
 * @param el The host element to copy from and watch.
 * @param onChange Called after the attributes change, so the component can re-render.
 * @param hostOwnedAttributes Attributes copied at load but not watched. See
 * `createAttributeController`.
 */
export declare const createAriaAttributeController: (el: HTMLElement, onChange: () => void, hostOwnedAttributes?: string[]) => AttributeController;
export type AttributeController = {
    /**
     * The attributes copied off the host element. Spread these onto the native element
     * in `render()`.
     */
    readonly attributes: Attributes;
    /**
     * Resumes watching the host element. Only needed from `connectedCallback`, because the
     * controller can't just be recreated in `componentWillLoad` after a move once the
     * initial copy has taken the attributes off the host.
     */
    init: () => void;
    /**
     * Stops watching the host element. Call this from `disconnectedCallback`.
     */
    destroy: () => void;
};
