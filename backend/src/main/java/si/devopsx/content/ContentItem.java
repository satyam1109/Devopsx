package si.devopsx.content;

import java.util.List;

public record ContentItem(String id, String kind, String parentId, List<String> trackIds,
    String title, String summary, String status, int position, int minutes,
    List<String> tags, List<Block> blocks, String cardType, String question,
    String answer, List<String> options, Integer correctOption, List<String> correctOrder) {
  public ContentItem {
    trackIds=trackIds==null?List.of():trackIds;tags=tags==null?List.of():tags;
    blocks=blocks==null?List.of():blocks;options=options==null?List.of():options;
    correctOrder=correctOrder==null?List.of():correctOrder;summary=summary==null?"":summary;
  }
  public record Block(String id, String type, String title, String text, String language, String url, String alt) {}
  public ContentItem withId(String value) {
    return new ContentItem(value,kind,parentId,trackIds,title,summary,status,position,minutes,tags,blocks,cardType,question,answer,options,correctOption,correctOrder);
  }
}
