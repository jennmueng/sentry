import {useCallback, useMemo} from 'react';
import styled from '@emotion/styled';

import space from 'sentry/styles/space';
import {FlamegraphFrame} from 'sentry/utils/profiling/flamegraphFrame';
import {formatColorForFrame} from 'sentry/utils/profiling/gl/utils';
import {VirtualizedTreeNode} from 'sentry/utils/profiling/hooks/useVirtualizedTree/VirtualizedTreeNode';
import {FlamegraphRenderer} from 'sentry/utils/profiling/renderers/flamegraphRenderer';

import {FrameCallersTableCell} from './frameStack';

function computeRelativeWeight(base: number, value: number) {
  // Make sure we dont divide by zero
  if (!base || !value) {
    return 0;
  }
  return (value / base) * 100;
}

interface FrameStackTableRowProps {
  flamegraphRenderer: FlamegraphRenderer;
  handleExpandedClick: (
    node: VirtualizedTreeNode<FlamegraphFrame>,
    opts?: {expandChildren: boolean}
  ) => void;
  node: VirtualizedTreeNode<FlamegraphFrame>;
  referenceNode: FlamegraphFrame;
  style: React.CSSProperties;
}

export function FrameStackTableRow({
  node,
  flamegraphRenderer,
  referenceNode,
  handleExpandedClick,
  style,
}: FrameStackTableRowProps) {
  const colorString = useMemo(() => {
    return formatColorForFrame(node.node, flamegraphRenderer);
  }, [node, flamegraphRenderer]);

  const handleExpanding = useCallback(
    (evt: React.MouseEvent) => {
      handleExpandedClick(node, {expandChildren: evt.metaKey});
    },
    [node, handleExpandedClick]
  );

  return (
    <FrameCallersRow onClick={handleExpanding} style={style}>
      <FrameCallersTableCell textAlign="right">
        {flamegraphRenderer.flamegraph.formatter(node.node.node.selfWeight)}
        <Weight
          weight={computeRelativeWeight(
            referenceNode.node.totalWeight,
            node.node.node.selfWeight
          )}
        />
      </FrameCallersTableCell>
      <FrameCallersTableCell textAlign="right">
        {flamegraphRenderer.flamegraph.formatter(node.node.node.totalWeight)}
        <Weight
          weight={computeRelativeWeight(
            referenceNode.node.totalWeight,
            node.node.node.totalWeight
          )}
        />
      </FrameCallersTableCell>
      <FrameCallersTableCell
        // We stretch this table to 100% width.
        style={{paddingLeft: node.depth * 14 + 8, width: '100%'}}
      >
        <FrameNameContainer>
          <FrameColorIndicator backgroundColor={colorString} />
          <FrameChildrenIndicator open={node.expanded}>
            {node.node.children.length > 0 ? '\u203A' : null}
          </FrameChildrenIndicator>
          <FrameName>{node.node.frame.name}</FrameName>
        </FrameNameContainer>
      </FrameCallersTableCell>
    </FrameCallersRow>
  );
}

const Weight = styled((props: {weight: number}) => {
  const {weight, ...rest} = props;
  return (
    <div {...rest}>
      {weight.toFixed(2)}%
      <BackgroundWeightBar style={{transform: `scaleX(${weight / 100})`}} />
    </div>
  );
})`
  display: inline-block;
  min-width: 7ch;
  color: ${props => props.theme.subText};
`;

const BackgroundWeightBar = styled('div')`
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  background-color: ${props => props.theme.yellow100};
  border-bottom: 1px solid ${props => props.theme.yellow200};
  transform-origin: center right;
  height: 100%;
  width: 100%;
`;

const FrameCallersRow = styled('div')`
  display: flex;
  width: 100%;

  &:hover {
    background-color: ${p => p.theme.surface400};
  }
`;

const FrameNameContainer = styled('div')`
  display: flex;
  align-items: center;
`;

const FrameChildrenIndicator = styled('span')<{open: boolean}>`
  width: 1ch;
  height: 1ch;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transform: ${p => (p.open ? 'rotate(90deg)' : 'rotate(0deg)')};
`;

const FrameName = styled('span')`
  margin-left: ${space(0.5)};
`;

const FrameColorIndicator = styled('div')<{
  backgroundColor: React.CSSProperties['backgroundColor'];
}>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
  background-color: ${p => p.backgroundColor};
  margin-right: ${space(1)};
`;
