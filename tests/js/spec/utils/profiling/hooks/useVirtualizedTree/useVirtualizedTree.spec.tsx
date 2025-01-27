import {reactHooks, waitFor} from 'sentry-test/reactTestingLibrary';

import {useVirtualizedTree} from 'sentry/utils/profiling/hooks/useVirtualizedTree/useVirtualizedTree';

const n = d => {
  return {...d, children: []};
};

// Creates a tree with N nodes where each node has only one child
const chain = (prefix: string, depth: number) => {
  let node = n({id: `${prefix}-0`});
  let start = 1;
  // Keep a root reference so we can return it
  const root = node;

  // Build a tree of nodes with each node having only one child
  while (start < depth) {
    const child = n({id: `${prefix}-${start}`});
    node.children = [child];
    // Swap the current node
    node = child;
    start++;
  }

  return root;
};

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
window.requestAnimationFrame = (cb: Function) => cb();

describe('useVirtualizedTree', () => {
  it('returns a tree', () => {
    const results = reactHooks.renderHook(() =>
      useVirtualizedTree({
        overscroll: 0,
        rowHeight: 10,
        roots: [],
        scrollContainerRef: {current: null},
      })
    );

    expect(results.result.current.items).toEqual([]);
  });

  it('shows first 10 items', () => {
    const mockScrollContainer = {
      getBoundingClientRect: () => {
        return {height: 100};
      },
    };

    const roots = [chain('child', 10)];

    const {result} = reactHooks.renderHook(() =>
      useVirtualizedTree({
        rowHeight: 10,
        scrollContainerRef: {current: mockScrollContainer as HTMLDivElement},
        overscroll: 0,
        roots,
      })
    );

    reactHooks.act(() => {
      // @ts-ignore
      result.current.handleExpandTreeNode(result.current.tree.roots[0], {
        expandChildren: true,
      });
    });

    for (let i = 0; i < 10; i++) {
      expect(result.current.items[i].item.node.id).toEqual(`child-${i}`);
    }
    expect(result.current.items.length).toBe(10);
  });

  it('shows 5-15 items', async () => {
    const mockScrollContainer = {
      getBoundingClientRect: () => {
        return {height: 100};
      },
    };

    const roots = [chain('child', 20)];

    const {result} = reactHooks.renderHook(() =>
      useVirtualizedTree({
        rowHeight: 10,
        scrollContainerRef: {current: mockScrollContainer as HTMLDivElement},
        overscroll: 0,
        roots,
      })
    );

    reactHooks.act(() => {
      result.current.handleExpandTreeNode(result.current.tree.roots[0], {
        expandChildren: true,
      });
      result.current.handleScroll({target: {scrollTop: 50}});
    });

    await waitFor(() => {
      expect(result.current.items.length).toBe(10);
    });
    for (let i = 0; i < 10; i++) {
      expect(result.current.items[i].item.node.id).toEqual(`child-${i + 5}`);
    }
    expect(result.current.items.length).toBe(10);
  });

  it('shows last 10 items', async () => {
    const mockScrollContainer = {
      getBoundingClientRect: () => {
        return {height: 100};
      },
    };

    const roots = [chain('child', 20)];

    const {result} = reactHooks.renderHook(() =>
      useVirtualizedTree({
        rowHeight: 10,
        scrollContainerRef: {current: mockScrollContainer as HTMLDivElement},
        overscroll: 0,
        roots,
      })
    );

    reactHooks.act(() => {
      result.current.handleExpandTreeNode(result.current.tree.roots[0], {
        expandChildren: true,
      });
      result.current.handleScroll({target: {scrollTop: 100}});
    });

    await waitFor(() => {
      expect(result.current.items.length).toBe(10);
    });
    for (let i = 0; i < 10; i++) {
      expect(result.current.items[i].item.node.id).toEqual(`child-${i + 10}`);
    }
    expect(result.current.items.length).toBe(10);
  });

  it('shows overscroll items', async () => {
    const mockScrollContainer = {
      getBoundingClientRect: () => {
        return {height: 100};
      },
    };

    const roots = [chain('child', 20)];

    const {result} = reactHooks.renderHook(() =>
      useVirtualizedTree({
        rowHeight: 10,
        scrollContainerRef: {current: mockScrollContainer as HTMLDivElement},
        overscroll: 2,
        roots,
      })
    );

    reactHooks.act(() => {
      result.current.handleExpandTreeNode(result.current.tree.roots[0], {
        expandChildren: true,
      });
      result.current.handleScroll({target: {scrollTop: 50}});
    });

    for (let i = 3; i < 17; i++) {
      // Should display nodes 5-15, but since we use overscroll, it should display nodes 3-17
      expect(result.current.items[i - 3].item.node.id).toEqual(`child-${i}`);
    }
    expect(result.current.items.length).toBe(14);
  });

  it('items have a stable key', async () => {
    const mockScrollContainer = {
      getBoundingClientRect: () => {
        return {height: 100};
      },
    };

    const roots = [chain('child', 20)];

    const {result} = reactHooks.renderHook(() =>
      useVirtualizedTree({
        rowHeight: 10,
        scrollContainerRef: {current: mockScrollContainer as HTMLDivElement},
        overscroll: 0,
        roots,
      })
    );

    reactHooks.act(() => {
      result.current.handleExpandTreeNode(result.current.tree.roots[0], {
        expandChildren: true,
      });
      result.current.handleScroll({target: {scrollTop: 50}});
    });

    const stableKeys = result.current.items.map(item => item.key);

    reactHooks.act(() => {
      result.current.handleScroll({target: {scrollTop: 60}});
    });

    // First 9 items should be the same, the last item should be different
    for (let i = 1; i < stableKeys.length; i++) {
      expect(stableKeys[i]).toBe(result.current.items[i - 1].key);
    }

    // Last item should be different
    expect(result.current.items[result.current.items.length - 1].key).toBe(
      stableKeys[stableKeys.length - 1] + 1
    );
  });
});
